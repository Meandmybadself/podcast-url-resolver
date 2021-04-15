/* eslint-disable complexity */

import {find, set, omit} from 'lodash';
import {IPlatformClient, ISearchCriteria, ICanonicalPodcast, ICanonicalEpisode, ICanonicalPodcastWithEpisodes, IFeedEpisode} from '../interfaces';
import {loadAndUpsertFeed, loadFeed} from './feed';
import {makeSearchSafeString} from '../utilities/string';
import CanonicalEpisode from '../models/00-canonical-episode';
import Overcast from './platforms/overcast';
import Platform from '../models/00-platform';
import PlatformPodcast from '../models/platform-podcast';
import PlatformEpisodeURL from '../models/platform-episode-url';
import PlatformHost from '../models/platform-host';
import CanonicalPodcast from '../models/00-canonical-podcast';
import PodcastIndexAPI from 'podcast-index-api';
import normalizeUrl from 'normalize-url';
import Apple from './platforms/apple';
import PlatformEpisode from '../models/platform-episode';
import PlatformData from './platform-data';

// Instantiate platform clients
const PLATFORM_CLIENTS: Record<string, IPlatformClient> = {
	overcast: new Overcast(),
	apple: new Apple()
};

const podcastIndexAPI = PodcastIndexAPI(process.env.PODCASTINDEX_KEY, process.env.PODCASTINDEX_SECRET);

export const lookupEpisodeByShareURL = async (platformEpisodeURL: string) => {
	let searchCriteria: ISearchCriteria | void;
	let episodes: any;

	platformEpisodeURL = normalizeUrl(platformEpisodeURL);

	// Have we already looked this URL up?
	const existingResult = await getEpisodeByShareURL(platformEpisodeURL);
	if (existingResult) {
		return existingResult;
	}

	// Do we have a service to lookup details for this hostname?
	const {hostname} = new URL(platformEpisodeURL);
	const platform = (await PlatformHost.findOne({
		where: {
			hostname
		},
		include: Platform
	}))?.platform;

	if (platform?.platformId) {
		console.log(`Performing service lookup for ${platform.platformId}`);
		// We have an active lookup service for this hostname.
		const service: IPlatformClient = PLATFORM_CLIENTS[platform.platformId];
		searchCriteria = await service.getSearchCriteriaFromShareURL(platformEpisodeURL);

		if (searchCriteria) {
			// We found at minimum, a podcast title & episode title to work with.
			let canonicalPodcast: ICanonicalPodcast | undefined;
			let canonicalEpisode: ICanonicalEpisode | undefined;

			// Did we find a feed URL when looking @ the page?
			if (searchCriteria.feedURL) {
				// Use the feed URL to look up the podcast.
				canonicalPodcast = (await CanonicalPodcast.findOne({where: {feedURL: searchCriteria.feedURL}, plain: true}));
			}

			if (!canonicalPodcast) {
				// We didn't find a feedURL-based podcast.
				// Do we have a canonical podcast in the db that matches title?
				const searchTitle: string = makeSearchSafeString(searchCriteria.podcastTitle);
				canonicalPodcast = (await CanonicalPodcast.findOne({where: {searchTitle}, plain: true}));
			}

			if (!canonicalPodcast) {
				console.log(`Podcastindex lookup: "${searchCriteria.podcastTitle}"`);
				// We don't have a canonical podcast in the db.
				// Let's ask Podcastindex if it knows about this pod.
				const podcastIndexResult = await podcastIndexAPI.searchByTerm(searchCriteria.podcastTitle);

				// Get rid of podcats we can't use.
				if (podcastIndexResult?.feeds?.length) {
					podcastIndexResult.feeds = podcastIndexResult.feeds.filter(feedItem =>
						feedItem.locked !== 1 &&
						feedItem.dead !== 1);
				}

				if (podcastIndexResult?.feeds?.length) {
					console.log('Found an episode in podcastindex.');
					// We're presuming that the first match is the correct match.
					// If this turns out to not be the case, do some string comparison checking.
					// We only need the feed URL.
					const {
						url,
						itunesId
					}: {
						url: string;
						itunesId: number;
						id: number;
					} = podcastIndexResult.feeds[0];

					const podcastWithEpisodes: ICanonicalPodcastWithEpisodes = await loadAndUpsertFeed(url);

					if (podcastWithEpisodes) {
						canonicalPodcast = omit(podcastWithEpisodes, ['episodes']);
						episodes = podcastWithEpisodes.episodes;

						if (itunesId) {
							// If an iTunes podcast ID is provided, we might as well toss this in the DB too.
							console.log('Found an iTunes podcast id in podcastindex.  Inserting.');
							const platformId: number = (await PlatformData.getPlatformById('apple')).id;
							try {
								await PlatformPodcast.create({
									platformPodcastId: itunesId.toString(),
									platformId,
									canonicalPodcastId: canonicalPodcast.id
								});
							} catch (error: unknown) {
								console.log('Could not create iTunes platform podcast', error);
							}
						}
					}
				} else {
					console.warn('Podcastindex returned zero canonical results.');
				}

				if (canonicalPodcast) {
					// We have a canonical record of this podcast in the database.
					// Do we have a canonical record of the episode?
					const episodeSearchTitle: string = makeSearchSafeString(searchCriteria.episodeTitle);
					canonicalEpisode = (await CanonicalEpisode.findOne({where: {searchTitle: episodeSearchTitle, podcastId: canonicalPodcast.id}, plain: true}));

					if (!canonicalEpisode) {
						console.log('No canonical episode in DB. Looking up.');
						// No canonical episode.
						// We _should_ have one if we look in the feed episode list.
						// Did we load the feed episode list?
						if (!episodes) {
							// We did not. Load feed.
							const feed = await loadFeed(canonicalPodcast.feedURL);
							if (feed && feed.episodes) { // eslint-disable-line @typescript-eslint/prefer-optional-chain
								episodes = feed.episodes;
							}
						}

						const feedCanonicalEpisode: IFeedEpisode | undefined = find(episodes, {title: searchCriteria.episodeTitle});

						if (feedCanonicalEpisode) {
							console.log('Adding canonical episode.');
							try {
								canonicalEpisode = await CanonicalEpisode.create({
									title: feedCanonicalEpisode.title,
									searchTitle: makeSearchSafeString(feedCanonicalEpisode.title),
									podcastId: canonicalPodcast.id,
									description: feedCanonicalEpisode.description,
									publishDate: new Date(feedCanonicalEpisode.published),
									episodeType: feedCanonicalEpisode.episodeType,
									duration: feedCanonicalEpisode.duration,
									guid: feedCanonicalEpisode.guid,
									enclosureURL: feedCanonicalEpisode.enclosure.url,
									artworkURL: feedCanonicalEpisode.image
								}).then(entity => entity.get({plain: true}));
							} catch (error: unknown) {
								console.log('Error while inserting podcast.', error);
							}
						}
					}

					if (canonicalEpisode && canonicalEpisode) {
						// We have a canonical version of the podcast and the episode in the database.
						// Add the platform podcasts / episodes.
						await Promise.all(Object.values(PLATFORM_CLIENTS).map(async (client: IPlatformClient) => client.ensurePodcastEpisode(canonicalPodcast, canonicalEpisode)));

						// Add the platform episode URL for future lookups.
						await PlatformEpisodeURL.findOrCreate({
							where: {
								platformEpisodeURL,
								episodeId: canonicalEpisode.id,
								platformId: platform.id
							}
						});
					}

					// Return a nice response.
					// Initially, we'll yank it out of the db, but am guessing there's a better way to do this.
					const result = await getEpisodeByShareURL(platformEpisodeURL);
					if (result) {
						return result;
					}
				}
			}
		}
	}
};

const getEpisodeByShareURL = async (platformEpisodeURL: string) => {
	const episodeURL = (await PlatformEpisodeURL.findOne({
		where: {
			platformEpisodeURL
		},
		include: CanonicalEpisode
	}));

	if (episodeURL) {
		const canonicalEpisode = episodeURL.episode.get({plain: true});

		if (canonicalEpisode) {
			const canonicalPodcast = (await CanonicalPodcast.findOne({
				where: {
					id: canonicalEpisode.podcastId
				},
				plain: true
			}))?.get({plain: true});

			if (canonicalPodcast) {
				// Associate podcast
				set(canonicalEpisode, 'podcast', canonicalPodcast);

				console.log('Looking up third party episodes');

				const thirdPartyEpisodeURLs = await getThirdPartyPlatformEpisodeURLs(canonicalPodcast, canonicalEpisode);

				set(canonicalEpisode, 'thirdPartyEpiosdeRLs', thirdPartyEpisodeURLs);

				canonicalEpisode['podcast'] = omit(canonicalEpisode['podcast'], ['searchTitle', 'id', 'createdAt', 'updatedAt', 'deletedAt']);

				return omit(canonicalEpisode, ['createdAt', 'updatedAt', 'searchTitle', 'id', 'createdAt', 'updatedAt', 'deletedAt']);
			}
		}
	}
};

export const lookupEpisodeByFeedURLAndGUID = async (feedURL: string, guid: string) => {
	feedURL = normalizeUrl(feedURL);

	// This will ensure that we have a canonical feed in the db.
	const feed: ICanonicalPodcastWithEpisodes = await loadAndUpsertFeed(feedURL);
	const canonicalPodcast: ICanonicalPodcast = omit(feed, ['episodes']);
	const canonicalEpisode: ICanonicalEpisode | undefined = find(feed.episodes, {guid});

	if (canonicalPodcast && canonicalEpisode) {
		await Promise.all(Object.values(PLATFORM_CLIENTS).map(async (client: IPlatformClient) => client.ensurePodcastEpisode(canonicalPodcast, canonicalEpisode)));
	}

	// We should now have canonical & platform episodes in the database.  Let's return what we've got.
	const thirdPartyURLs = await getThirdPartyPlatformEpisodeURLs(canonicalPodcast, canonicalEpisode);

	set(canonicalEpisode, 'thirdPartyURLs', thirdPartyURLs);
	return canonicalEpisode;
};

export const lookupPodcastByFeedURL = async (feedURL: string): Promise<Record<string, string>> => {
	let canonicalPodcast: ICanonicalPodcast | undefined;
	feedURL = normalizeUrl(feedURL);

	// Do we have a podcast w/ that feed URL?
	canonicalPodcast = (await CanonicalPodcast.findOne({where: {feedURL}, plain: true}));

	if (!canonicalPodcast) {
		canonicalPodcast = await loadAndUpsertFeed(feedURL);
	}

	if (canonicalPodcast) {
		// We have a canonical podcast in the database.
		// Use the title to look up the platform podcasts
		const thirdPartyFeedURLs = {};
		await Promise.all(Object.keys(PLATFORM_CLIENTS).map(async platformId => {
			let feedURL: string | void;
			switch (platformId) {
				case 'overcast':
					feedURL = await Overcast.fetchPodcastURLByTitle(canonicalPodcast.title);
					break;
				case 'apple':
					feedURL = await Apple.fetchPodcastURLByTitle(canonicalPodcast.title);
					break;
			}

			if (feedURL) {
				thirdPartyFeedURLs[platformId] = feedURL;
			}
		}));

		// Google.
		if (canonicalPodcast.feedURL) {
			thirdPartyFeedURLs['google'] = `https://podcasts.google.com/?feed=${Buffer.from(canonicalPodcast.feedURL).toString(
				'base64'
			)}`;
		}

		return thirdPartyFeedURLs;
	}
};

const getThirdPartyPlatformEpisodeURLs = async (canonicalPodcast: ICanonicalPodcast, canonicalEpisode: ICanonicalEpisode): Promise<Record<string, string>> => {
	// Associate platform episodes.
	const platformEpisodes = (await PlatformEpisode.findAll({
		where: {
			episodeId: canonicalEpisode.id
		},
		attributes: [
			'platformEpisodeId',
			'platformId'
		]
	})).map(platformEpisode => platformEpisode.get({plain: true}));

	console.log(`Found ${platformEpisodes.length} third-party episodes`);
	const thirdPartyURLs = {};

	await Promise.all(platformEpisodes.map(async platformEpisode => {
		const platform = await PlatformData.getPlatformByDBId(platformEpisode.platformId);

		if (!platform) {
			throw new Error(`Unable to lookup episode platform: ${platformEpisode.platformId}`);
		}

		switch (platform.platformId) {
			case 'overcast':
				thirdPartyURLs[platform.platformId] = `https://overcast.fm${platformEpisode.platformEpisodeId}`;
				break;
			case 'apple':
				// Look up platform episode id.
				const platformPodcast = await PlatformPodcast.findOne({where: {platformId: platformEpisode.platformId}}); // eslint-disable-line no-case-declarations
				thirdPartyURLs[platform.platformId] = `https://podcasts.apple.com/us/podcast/a/id${platformPodcast.platformPodcastId}?i=${platformEpisode.platformEpisodeId}`;
				break;
		}
	}));

	if (canonicalEpisode.guid && canonicalPodcast.feedURL) {
		thirdPartyURLs['google'] = `https://podcasts.google.com/?feed=${Buffer.from(canonicalPodcast.feedURL).toString(
			'base64'
		)}&episode=${Buffer.from(canonicalEpisode.guid).toString('base64')}`;
	}

	return thirdPartyURLs;
};
