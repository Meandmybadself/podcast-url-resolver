import axios, {AxiosInstance} from 'axios';
import {IPlatformClient, ISearchCriteria} from '../../interfaces';
import BasePlatformClient from './base-platform';
import cheerio from 'cheerio';
import Apple from './apple';
import PlatformEpisode from '../../models/platform-episode';
import PlatformEpisodeURL from '../../models/platform-episode-url';
import {normalizeText, makeSearchSafeString} from '../../utilities/string';

// Interface OvercastEpisode {
// 	overcastId: string;
// 	overcastURL: string;
// }

export default class Overcast extends BasePlatformClient implements IPlatformClient {
	_axiosInstance: AxiosInstance;
	_id: string;

	constructor() {
		super();
		this._id = 'overcast';

		this._axiosInstance = axios.create({
			withCredentials: true,
			headers: {
				Cookie: process.env.OVERCAST_COOKIE
			}
		});
	}

	static async fetchPodcastURLByTitle(title: string): Promise<string | void> {
		const applePodcastId: string = await Apple.fetchPodcastByTitle(title);
		if (applePodcastId) {
			return `https://overcast.fm/itunes${applePodcastId}`;
		}
	}

	async getSearchCriteriaFromShareURL(shareURL: string): Promise<ISearchCriteria | null> {
		try {
			const {data} = await this._axiosInstance.get(shareURL);
			const $ = cheerio.load(data);
			const podcastTitle: string = $('h3 > a').text();
			const episodeTitle: string = $('h2').text();

			if (podcastTitle && episodeTitle) {
				return {
					podcastTitle,
					episodeTitle
				};
			}
		} catch (error: unknown) {
			console.error('Error in getSearchCriteria', error);
		}
	}

	async fetchPlatformEpisode(canonicalPodcast: any, canonicalEpisode: any): Promise<void> {
		const platformId = await this.getPlatformId();

		// There isn't any cost-savings in persisting just the podcast id in the db here, because when you query overcast, you get all episodes
		const podcastURL: string | void = await Overcast.fetchPodcastURLByTitle(canonicalPodcast.title);
		if (podcastURL) {
			const {data} = await this._axiosInstance.get(podcastURL);
			const page = cheerio.load(data);
			const episode = page('a.extendedepisodecell')
				.toArray()
				.map(element => ({
					title: normalizeText(cheerio(element).find('.title').text()),
					overcastId: element.attribs.href,
					overcastURL: `https://overcast.fm${element.attribs.href}`
				}))
				.find(element => makeSearchSafeString(element.title) === makeSearchSafeString(canonicalEpisode.title));

			if (episode) {
				console.log('Found overcast episode. Inserting.');
				await PlatformEpisode.findOrCreate({
					where: {
						platformId,
						episodeId: canonicalEpisode.id,
						podcastId: canonicalPodcast.id,
						platformEpisodeId: episode.overcastId
					}
				});

				await PlatformEpisodeURL.findOrCreate({
					where: {
						episodeId: canonicalEpisode.id,
						platformId,
						platformEpisodeURL: episode.overcastURL
					}
				});
			} else {
				console.log('Did not find an overcast episode');
			}
		}
	}
}

