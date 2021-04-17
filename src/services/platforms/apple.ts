import {AxiosInstance} from 'axios';
import {ICanonicalEpisode, ICanonicalPodcast, IPlatformClient, ISearchCriteria} from '../../interfaces';
import BasePlatformClient from './base-platform';
import {some, find} from 'lodash';
import {makeSearchSafeString} from '../../utilities/string';
import PlatformPodcast from '../../models/platform-podcast';
import PlatformEpisode from '../../models/platform-episode';
import PlatformEpisodeURL from '../../models/platform-episode-url';

export default class Apple extends BasePlatformClient implements IPlatformClient {
	_id: string;
	_axiosInstance: AxiosInstance;

	constructor() {
		super();
		this._id = 'apple';
	}

	static async fetchPodcastURLByTitle(title: string): Promise<string | void> {
		const podcastId: string = await Apple.fetchPodcastByTitle(title);
		if (podcastId) {
			return `https://podcasts.apple.com/us/podcast/listing/id${podcastId}`;
		}
	}

	static async fetchPodcastByTitle(title: string): Promise<string> {
		// Apple podcast search
		const {results} = (await BasePlatformClient.getPageData(
			`https://itunes.apple.com/search?term=${encodeURIComponent(title)}&limit=1&media=podcast`)
		);
		if (some(results)) {
			return results[0].collectionId;
		}
	}

	async getSearchCriteriaFromShareURL(shareURL: string): Promise<ISearchCriteria | void> {
		try {
			const data: string = (await BasePlatformClient.getPageData(shareURL)).toString();
			const episodeTitle: string | void = BasePlatformClient.getRegExpMatch(`${data}`, /AudioObject","name":"([^"]+)"/);
			const podcastTitle: string | void = BasePlatformClient.getRegExpMatch(`${data}`, /isPartOf":"([^"]+)/);

			const matches = /id(\d+)\?i=(\d+)/.exec(shareURL);
			if (matches) {
				const [, platformPodcastId, platformEpisodeId] = matches;
				if (episodeTitle && podcastTitle) {
					return {
						platformEpisodeId,
						platformPodcastId,
						podcastTitle,
						episodeTitle
					};
				}
			}
		} catch {
			console.error('Error in getSearchCriteria - Apple');
		}
	}

	async lookupAppleItem(appleId: string): Promise<any> {
		const url = `https://itunes.apple.com/lookup?id=${appleId}`;
		const data = await BasePlatformClient.getPageData(url);
		const {results} = data;
		if (some(results)) {
			return results[0];
		}
	}

	async fetchPlatformEpisode(canonicalPodcast: ICanonicalPodcast, canonicalEpisode: ICanonicalEpisode): Promise<void> {
		const platformId = await this.getPlatformId();
		let platformPodcast: any;

		// There isn't any cost-savings in persisting just the podcast id here, because when you query apple, you get all episodes
		const platformPodcastId: string = await Apple.fetchPodcastByTitle(canonicalPodcast.title);

		if (platformPodcastId) {
			// Try to create it.  It may already exist.
			platformPodcast = await PlatformPodcast.findOrCreate({
				where: {
					platformId,
					canonicalPodcastId: canonicalPodcast.id,
					platformPodcastId: platformPodcastId.toString()
				}
			}).then(([entity]) => entity.get({plain: true}));
		}

		// Apple episode search
		if (platformPodcast) {
			const url = `http://itunes.apple.com/lookup?id=${platformPodcastId}&entity=podcastEpisode&limit=200`;
			const results = (await BasePlatformClient.getPageData(url)).results
				.filter((result: any) => result.kind !== 'podcast') // This means it's the podcast itself.
				.map(result => ({...result, searchTitle: makeSearchSafeString(result.trackName)}));

			// Find our episode.
			const episode: any = find(results, {searchTitle: canonicalEpisode.searchTitle});
			if (episode) {
				try {
					await PlatformEpisode.create({
						platformId,
						episodeId: canonicalEpisode.id,
						podcastId: canonicalPodcast.id,
						platformEpisodeId: episode.trackId
					});
				} catch (error: unknown) {
					console.log('Error while attempting to create an apple platform episode', error);
				}

				try {
					const episodeId: string = episode.trackId;

					await PlatformEpisodeURL.create({
						episodeId: canonicalEpisode.id,
						platformId,
						platformEpisodeURL: `https://podcasts.apple.com/us/podcast/id${platformPodcastId}?i=${episodeId}`
					});
				} catch (error: unknown) {
					console.log('Error while attempting to create an apple platform episode url', error);
				}
			} else {
				console.log('Did not find an Apple result.');
			}
		}
	}
}
