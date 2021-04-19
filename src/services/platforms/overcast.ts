import axios, {AxiosInstance, AxiosResponse} from 'axios';
import {ICanonicalEpisode, ICanonicalPodcast, IPlatformClient, ISearchCriteria} from '../../interfaces';
import BasePlatformClient from './base-platform';
import cheerio from 'cheerio';
import Apple from './apple';
import PlatformEpisode from '../../models/platform-episode';
import PlatformEpisodeURL from '../../models/platform-episode-url';
import {normalizeText, makeSearchSafeString} from '../../utilities/string';
import https from 'https';

// Go get an auth cookie with a raw https request, like the amish did.
const getAuthCookie = async () => new Promise((resolve, reject) => {
	const request = https.request({
		host: 'overcast.fm',
		path: '/login',
		port: 443,
		method: 'POST',
		headers: {
			'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:87.0) Gecko/20100101 Firefox/87.0',
			accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
			'accept-language': 'en-US,en;q=0.5',
			'accept-encoding': 'gzip, deflate, br',
			'content-type': 'application/x-www-form-urlencoded',
			'content-length': '134',
			origin: 'https://overcast.fm',
			dnt: '1',
			referer: 'https://overcast.fm/login',
			cookie: 'o=-',
			'upgrade-insecure-requests': '1',
			te: 'trailers'
		}
	}, response => {
		const authCookie: string | void = BasePlatformClient.getRegExpMatch(response.headers['set-cookie'][0], /(o=[^;]+)/);
		if (authCookie) {
			resolve(authCookie);
			return;
		}

		reject(new Error('Login to Overcast failed'));
	});

	request.write(`then=podcasts&email=${process.env.OVERCAST_EMAIL}&password=${process.env.OVERCAST_PASSWORD}`);
	request.end();
});

export default class Overcast extends BasePlatformClient implements IPlatformClient {
	_axiosInstance: AxiosInstance;
	_id: string;

	constructor() {
		super();
		this._id = 'overcast';

		void this._performAuth();
	}

	static async fetchPodcastURLByTitle(title: string): Promise<string | void> {
		const applePodcastId: string = await Apple.fetchPodcastByTitle(title);
		if (applePodcastId) {
			return `https://overcast.fm/itunes${applePodcastId}`;
		}
	}

	async _performAuth() {
		const Cookie = await getAuthCookie();

		this._axiosInstance = axios.create({
			withCredentials: true,
			headers: {
				Cookie
			}
		});

		console.log('🔒 Signed into Overcast');
	}

	async getSearchCriteriaFromShareURL(shareURL: string): Promise<ISearchCriteria | void> {
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

	async fetchPlatformEpisode(canonicalPodcast: ICanonicalPodcast, canonicalEpisode: ICanonicalEpisode): Promise<void> {
		const platformId = await this.getPlatformId();

		// There isn't any cost-savings in persisting just the podcast id in the db here, because when you query overcast, you get all episodes
		const podcastURL: string | void = await Overcast.fetchPodcastURLByTitle(canonicalPodcast.title);
		if (podcastURL) {
			console.log('Found Overcast episode URL', podcastURL);
			let response: AxiosResponse;
			try {
				response = await this._axiosInstance.get(podcastURL);
				const {data} = response;
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
					console.log('Found Overcast episode', episode.overcastId);
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
					const finalURL: string = response.request.res.responseUrl;
					console.log(`URL: ${finalURL}`);
				}
			} catch (error: unknown) {
				console.error('Error while trying to fetch Overcast episode', error);
				const finalURL: string = response.request.res.responseUrl;
				console.log(`URL: ${finalURL}`);
			}
		}
	}
}

