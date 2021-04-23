import {find} from 'lodash';
import {ICanonicalEpisode, ICanonicalPodcast, IPlatformClient, ISearchCriteria} from '../../interfaces';
import PlatformEpisode from '../../models/platform-episode';
import PlatformPodcast from '../../models/platform-podcast';
import {makeSearchSafeString} from '../../utilities/string';
import BasePlatformClient from './base-platform';

interface IHeartRadioPodcastResult {
	id: number;
	title: string;
	subtitle: string;
	description: string;
	image: string;
	score: number;
}

interface IHeartRadioEpisodeResult {
	id: number;
	podcastId: number;
	podcastSlug: string;
	title: string;
	duration: number;
	isExplicit: boolean;
	description: string;
	startDate: number;
	imageUrl: string;
}

interface IHeartRadioDescriptorObject {
	id: number;
	podcastId: number;
	podcastSlug: string;
	title: string;
	duration: number;
}

export default class IHeartRadio extends BasePlatformClient implements IPlatformClient {
	_id: string;

	constructor() {
		super();
		this._id = 'iheartradio';
	}

	static async fetchPodcastByTitle(title: string): Promise<IHeartRadioPodcastResult | void> {
		const platformPodcastSearchResults = await BasePlatformClient.getPageData(`https://us.api.iheart.com/api/v3/search/all?boostMarketId=116&bundle=true&keyword=true&keywords=${encodeURI(title)}&maxRows=3&countryCode=US&startIndex=0&albums=false&artist=false&playlist=false&station=false&podcast=true&track=false`);
		if (platformPodcastSearchResults?.results?.podcasts?.length) {
			const matchingPodcast = find(platformPodcastSearchResults.results.podcasts, (podcast: any) => makeSearchSafeString(title) === makeSearchSafeString(podcast.title));
			if (matchingPodcast) {
				return matchingPodcast;
			}
		}
	}

	static async fetchPodcastURLByTitle(title: string): Promise<string | void> {
		const podcast: IHeartRadioPodcastResult | void = await IHeartRadio.fetchPodcastByTitle(title);
		if (podcast) {
			return `https://www.iheart.com/podcast/${podcast.id}/`;
		}
	}

	async getSearchCriteriaFromShareURL(shareURL: string): Promise<ISearchCriteria | void> {
		const html = await BasePlatformClient.getPageData(shareURL);

		// This is a toughie.  Not a whole lot of parseable stuff on here.
		// HTML title could be used, but you'd be splitting by characters that could be in the episode / podcast titles.
		// At present, capturing the JS that it uses to display the episode is the best bet.
		// {"id":81424819,"podcastId":28643863,"podcastSlug":"990-Broken-Record","title":"Serj Tankian Talks, Toxicity and Activism","duration":3807
		const descriptor = BasePlatformClient.getRegExpMatch(html, /({"id":\d+,"podcastId":\d+,"podcastSlug":.+"duration":\d+)/);
		if (descriptor) {
			const descriptorObject: IHeartRadioDescriptorObject = JSON.parse(descriptor + '}');
			const podcastSlug = BasePlatformClient.getRegExpMatch(descriptorObject.podcastSlug, /\d+-(.+)/);
			if (podcastSlug) {
				return {
					podcastTitle: podcastSlug.replace('-', ' '),
					episodeTitle: descriptorObject.title
				};
			}
		}
	}

	async fetchPlatformEpisode(canonicalPodcast: ICanonicalPodcast, canonicalEpisode: ICanonicalEpisode): Promise<void> {
		const platformId = await this.getPlatformId();

		const platformPodcastSearchResult: IHeartRadioPodcastResult | void = await IHeartRadio.fetchPodcastByTitle(canonicalPodcast.title);

		if (platformPodcastSearchResult) {
			const platformPodcastId: string = platformPodcastSearchResult.id.toString();
			console.log('Found an iHeartRadio podcast', platformPodcastSearchResult.id);
			const platformPodcast = await PlatformPodcast.findOrCreate({
				where: {
					platformId,
					platformPodcastId,
					canonicalPodcastId: canonicalPodcast.id
				}
			}).then(([entity]) => entity.get({plain: true}));

			const platformEpisodeSearchResults = await BasePlatformClient.getPageData(`https://us.api.iheart.com/api/v3/podcast/podcasts/${platformPodcastId}/episodes?newEnabled=false&limit=500&sortBy=startDate-desc`);
			if (platformEpisodeSearchResults?.data?.length) {
				const matchingEpisode: IHeartRadioEpisodeResult = find(platformEpisodeSearchResults.data, (episode: any) => canonicalEpisode.searchTitle === makeSearchSafeString(episode.title));
				if (matchingEpisode) {
					console.log('Found an iHeartRadio episode', matchingEpisode.id);
					const platformEpisodeId: string = matchingEpisode.id.toString();
					await PlatformEpisode.findOrCreate({
						where: {
							platformId,
							platformEpisodeId,
							canonicalPodcastId: canonicalPodcast.id,
							canonicalEpisodeId: canonicalEpisode.id
						}
					});
				}
			}
		}
	}
}

