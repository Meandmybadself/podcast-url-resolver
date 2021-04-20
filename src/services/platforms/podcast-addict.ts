import {ICanonicalEpisode, ICanonicalPodcast, IPlatformClient, ISearchCriteria} from '../../interfaces';
import BasePlatformClient from './base-platform';
import cheerio from 'cheerio';
import {makeSearchSafeString} from '../../utilities/string';
import PlatformPodcast from '../../models/platform-podcast';
import PlatformEpisode from '../../models/platform-episode';
import axios from 'axios';

export default class PodcastAddict extends BasePlatformClient implements IPlatformClient {
	_id: string;

	constructor() {
		super();
		this._id = 'podcastaddict';
	}

	static async fetchPodcastURLByTitle(title: string): Promise<string | void> {
		const searchTitle = makeSearchSafeString(title);
		const $ = await BasePlatformClient.getPageDOM(`https://podcastaddict.com/?q=${encodeURI(title)}`);
		const matchingPodcasts = $('a.clickeableItemRow').toArray()
			.filter((element: any) => {
				const text = cheerio(element).find('h3 > div').text();
				return makeSearchSafeString(text) === searchTitle;
			})
			.map((element: any) => element.attribs.href);

		if (matchingPodcasts?.length) {
			return matchingPodcasts[0];
		}
	}

	async getSearchCriteriaFromShareURL(shareURL: string): Promise<ISearchCriteria | void> {
		const $ = await BasePlatformClient.getPageDOM(shareURL);
		return {
			podcastTitle: $('h1').text(),
			episodeTitle: $('h4').text()
		};
	}

	async fetchPlatformEpisode(canonicalPodcast: ICanonicalPodcast, canonicalEpisode: ICanonicalEpisode): Promise<void> {
		const platformId = await this.getPlatformId();
		const platformPodcastURL = await PodcastAddict.fetchPodcastURLByTitle(canonicalPodcast.title);
		if (platformPodcastURL) {
			// Just need the id to store.
			const platformPodcastId: string = platformPodcastURL.replace('https://podcastaddict.com/podcast/', '');
			console.log('Found a podcast addict podcast', platformPodcastId);
			const platformPodcast = await PlatformPodcast.findOrCreate({
				where: {
					platformId,
					platformPodcastId,
					canonicalPodcastId: canonicalPodcast.id
				}
			}).then(([entity]) => entity.get({plain: true}));

			if (platformPodcast) {
				// Go get the podcast.
				const pAddictPodcastPage = await BasePlatformClient.getPageDOM(platformPodcastURL);
				const matchingEpisodes = pAddictPodcastPage('a.clickeableItem[href^="https://podcastaddict.com/episode"]')
					.toArray()
					.filter((element: any) => {
						const title = cheerio(element).find('h5').text();
						return makeSearchSafeString(title) === canonicalEpisode.searchTitle;
					});

				if (matchingEpisodes.length > 0) {
					const matchingEpisode = matchingEpisodes[0];

					// This is a long URL that 301's to the real URL.
					const {request} = await axios.get(matchingEpisode.attribs.href);

					const finalEpisodeURL: string = request.res.responseUrl;

					const platformEpisodeId: string = finalEpisodeURL.replace('https://podcastaddict.com/episode/', '');
					if (platformEpisodeId) {
						console.log('Found a podcast addict episode', platformEpisodeId);
						await PlatformEpisode.findOrCreate({
							where: {
								platformId,
								canonicalPodcastId: canonicalPodcast.id,
								canonicalEpisodeId: canonicalEpisode.id,
								platformEpisodeId
							}
						});
					}
				}
			}
		}
	}
}
