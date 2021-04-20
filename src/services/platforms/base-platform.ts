import axios from 'axios';
import cheerio from 'cheerio';
import {ICanonicalEpisode, ICanonicalPodcast, IPlatform, IPlatformClient, ISearchCriteria} from '../../interfaces';
import PlatformEpisode from '../../models/platform-episode';
import PlatformData from '../platform-data';

export default class BasePlatformClient implements IPlatformClient {
	_id: string;

	static async getPageData(url: string): Promise<any> {
		try {
			return (await axios.get(url)).data;
		} catch (error: unknown) {
			console.error(`Error while attempting to load: ${url}`, error);
		}
	}

	static async getPageDOM(url: string): Promise<any> {
		const data = await BasePlatformClient.getPageData(url);
		return cheerio.load(data);
	}

	static getRegExpMatch(string: string, regex: RegExp): string | void {
		const matches = regex.exec(string);

		if (matches && matches[1]) { // eslint-disable-line @typescript-eslint/prefer-optional-chain
			return matches[1];
		}

		console.error('Unable to find a regex match.', regex);
	}

	async getPlatform(): Promise<IPlatform | null> {
		return PlatformData.getPlatformById(this._id);
	}

	async getPlatformId(): Promise<number | null> {
		return (await this.getPlatform()).id;
	}

	async getSearchCriteriaFromShareURL(_url: string): Promise<ISearchCriteria | void> {
		// Tries to find an empirical episode / podcast title given a URL.
		// This base method attempts to find them via RSS feed.
		throw new Error('getSearchCriteriaFromShareURL needs to be overridden. Is being called in BasePlatform');
	}

	async ensurePodcastEpisode(canonicalPodcast: ICanonicalPodcast, canonicalEpisode: ICanonicalEpisode): Promise<any> {
		const platformId: number = await this.getPlatformId();
		console.log('ensurePodcastEpisode', this._id);
		// See if we already have the platform episode.
		const ep = await PlatformEpisode.findOne({
			where: {
				episodeId: canonicalEpisode.id,
				podcastId: canonicalPodcast.id,
				platformId
			}
		});
		if (ep) {
			return;
		}

		return this.fetchPlatformEpisode(canonicalPodcast, canonicalEpisode);
	}

	async fetchPodcastByTitle(_title: string): Promise<void> {
		throw new Error('fetchPodcastByTitle needs to be overridden and was called in BasePlatform');
	}

	async fetchPlatformEpisode(_canonicalPodcast: any, _canonicalEpisode: any): Promise<void> {
		throw new Error('this._fetchPlatformEpisodes needs to be overridden and was called in BasePlatform');
	}
}
