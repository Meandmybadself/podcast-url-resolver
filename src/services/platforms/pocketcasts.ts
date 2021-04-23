import axios, {AxiosResponse} from 'axios';
import {ICanonicalEpisode, ICanonicalPodcast, IPlatformClient, ISearchCriteria} from '../../interfaces';
import {makeSearchSafeString, normalizeText} from '../../utilities/string';
import BasePlatformClient from './base-platform';
import {find} from 'lodash';
import PlatformPodcast from '../../models/platform-podcast';
import PlatformEpisode from '../../models/platform-episode';

interface IPocketCastPodcastSearchResult {
	uuid: string;
	collection_id: string;
	title: string;
	author: string;
	description: string;
	thumbnail: string;
}

interface IPocketCastEpisodeSearchResult {
	uuid: string;
	title: string;
	url: string;
	file_type: string;
	file_size: number;
	duration: number;
	published: string;
	type: string;
}

export default class Pocketcasts extends BasePlatformClient implements IPlatformClient {
	_id: string;

	constructor() {
		super();
		this._id = 'pocketcasts';
	}

	static async fetchPodcastIdByTitle(title: string): Promise<string | void> {
		console.log('Pocket Casts - _fetchPodcastByTitle', title);

		try {
			// Const datetime = moment().format('YYYYMMDDHHmmSS')
			// // 20200110233945
			// // 20200116224938
			// console.log({datetime})

			const searchRequest: AxiosResponse = await axios.post('https://refresh.pocketcasts.com/podcasts/search', {
				device: 'C6ABF416-5E74-4BB0-AE7E-F1431106D358',
				dt: '1',
				l: 'en',
				c: 'US',
				av: '7.6.1',
				m: '13.1.3',
				q: title,
				v: '1.6',
				datetime: '20200110233945',
				h: '47f9939a5aaf5798f19eb3a68f7036152388a4e8'
			});

			if (searchRequest.data.result?.search_results?.length) {
				console.log('Pocket Casts - Found results');
				return searchRequest.data.result.search_results[0].uuid;
			}

			console.log('Pocket Casts - No podcasts returned.');
		} catch {
			console.error('Pocket Casts - Error while fetching podcast', title);
		}
	}

	static async fetchPodcastURLByTitle(title: string): Promise<string | void> {
		const id: string | void = await Pocketcasts.fetchPodcastIdByTitle(title);
		if (id) {
			return `https://pca.st/podcast/${id}`;
		}
	}

	async getSearchCriteriaFromShareURL(shareURL: string): Promise<ISearchCriteria | void> {
		const $ = await BasePlatformClient.getPageDOM(shareURL);
		const title: string[] = $('meta[property=\'og:title\']')[0].attribs.content.split(' - ');
		const podcastTitle = title.pop();
		const episodeTitle = normalizeText(title.join(' - '));
		return {
			podcastTitle,
			episodeTitle
		};
	}

	async fetchPlatformEpisode(canonicalPodcast: ICanonicalPodcast, canonicalEpisode: ICanonicalEpisode): Promise<void> {
		const platformId = await this.getPlatformId();

		const platformEpisode = await PlatformEpisode.findOne({
			where: {
				platformId,
				canonicalPodcastId: canonicalPodcast.id,
				canonicalEpisodeId: canonicalEpisode.id
			}
		});

		if (platformEpisode) {
			return;
		}

		const pocketcastsPodcastId: string | void = await Pocketcasts.fetchPodcastIdByTitle(canonicalPodcast.title);

		if (pocketcastsPodcastId) {
			const platformPodcast = await PlatformPodcast.findOrCreate({
				where: {
					platformId,
					canonicalPodcastId: canonicalPodcast.id,
					platformPodcastId: pocketcastsPodcastId
				}
			}).then(([entity]) => entity.get({plain: true}));

			const episodeRequest = await BasePlatformClient.getPageData(
				`https://cache.pocketcasts.com/mobile/podcast/full/${pocketcastsPodcastId}/0/3/1500`
			);
			if (episodeRequest?.podcast?.episodes?.length) {
				console.log('Pocket Casts - upserting episode');
				const episodeSearchTitle: string = makeSearchSafeString(canonicalEpisode.title);
				const matchingEpisode: IPocketCastEpisodeSearchResult | undefined = find(episodeRequest.podcast.episodes, (episode: IPocketCastEpisodeSearchResult) => makeSearchSafeString(episode.title) === episodeSearchTitle);

				if (matchingEpisode) {
					console.log(`Pocket Casts - creating episode: ${matchingEpisode.uuid}`);
					await PlatformEpisode.create({
						canonicalEpisodeId: canonicalEpisode.id,
						platformId,
						platformEpisodeId: matchingEpisode.uuid,
						canonicalPodcastId: canonicalPodcast.id
					});
				}
			} else {
				console.log('Pocket Casts - No episodes returned');
			}
		}
	}
}
