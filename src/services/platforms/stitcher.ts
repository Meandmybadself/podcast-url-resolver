import {find} from 'lodash';
import {ICanonicalEpisode, ICanonicalPodcast, IPlatformClient, ISearchCriteria} from '../../interfaces';
import PlatformEpisode from '../../models/platform-episode';
import PlatformPodcast from '../../models/platform-podcast';
import {makeSearchSafeString} from '../../utilities/string';
import BasePlatformClient from './base-platform';

interface IStitcherPodcast {
	id: number;
	classic_id: number;
	title: string;
	description: string;
	html_description: string;
	episode_count: number;
	date_created: number;
	date_published: number;
	color_primary: string;
	image_thumbnail: string;
	image_small: string;
	image_large: string;
	image_base_url: string;
	default_season_id: null;
	default_sort: null;
	link: string;
	stitcher_link: string;
	social_facebook: string;
	social_twitter: string;
	social_instagram: null;
	publisher: null;
	is_published: boolean;
	is_public: boolean;
	cadence: null;
	seasons: any[];
	categories: Array<{
		id: number;
		parent_id: number;
		name: string;
	}>;
	primary_category_id: number;
	years: number[];
	restricted: any[];
	slug: string;
	tags: any[];
	alternate_slugs: any[];
}

interface IStitcherEpisode {
	id: number;
	show_id: number;
	classic_id: number;
	title: string;
	description: string;
	html_description: string;
	link: string;
	stitcher_link: any;
	is_published: boolean;
	season_id: any;
	season: null;
	audio_url: string;
	audio_url_restricted: any;
	date_updated: number;
	date_created: number;
	date_published: number;
	duration: number;
	duration_restricted: any;
	restriction: number;
	guid: string;
	slug: string;
}

const sanitizeStitcherQuery = (string: string): string => string.replace(/[^a-z|\s]/gi, '');

export default class Stitcher extends BasePlatformClient implements IPlatformClient {
	_id: string;

	constructor() {
		super();
		this._id = 'stitcher';
	}

	static async _searchForPodcast(title: string): Promise<IStitcherPodcast | void> {
		const {data} = await BasePlatformClient.getPageData(`https://api.prod.stitcher.com/search/shows?query=${encodeURI(sanitizeStitcherQuery(title))}&count=10`);
		if (data?.shows?.length) {
			const searchTitle = makeSearchSafeString(title);
			const matchingShow: IStitcherPodcast | undefined = find(data.shows, (show: IStitcherPodcast) => makeSearchSafeString(show.title) === searchTitle);
			if (matchingShow) {
				return matchingShow;
			}
		}
	}

	static async fetchPodcastURLByTitle(title: string): Promise<string | void> {
		const podcast = await Stitcher._searchForPodcast(title);
		if (podcast) {
			return `https://www.stitcher.com/show/${podcast.slug}`;
		}
	}

	async getSearchCriteriaFromShareURL(shareURL: string): Promise<ISearchCriteria | void> {
		console.log('getSearchCriteriaFromShareURL', shareURL);
		const $ = await BasePlatformClient.getPageDOM(shareURL);
		const podcastTitle = $('h2.showTitle').text();
		const episodeTitle = $('h2.episodeTitle').text();
		return {
			podcastTitle,
			episodeTitle
		};
	}

	async fetchPlatformEpisode(canonicalPodcast: ICanonicalPodcast, canonicalEpisode: ICanonicalEpisode): Promise<void> {
		const platformId = await this.getPlatformId();

		// We need the numerical ID and the slug for looking up a podcast.
		const stitcherPodcast: IStitcherPodcast | void = await Stitcher._searchForPodcast(canonicalPodcast.title);
		let platformPodcast: any;
		if (stitcherPodcast) {
			platformPodcast = await PlatformPodcast.findOrCreate({
				where: {
					platformId,
					canonicalPodcastId: canonicalPodcast.id,
					platformPodcastId: stitcherPodcast.slug
				}
			}).then(([entity]) => entity.get({plain: true}));

			if (platformPodcast) {
				const {data} = await BasePlatformClient.getPageData(`https://api.prod.stitcher.com/search/episodes?query=${encodeURI(sanitizeStitcherQuery(canonicalEpisode.title))}&count=100&offset=0`);
				if (data?.shows) {
					const episodeTitle: string = makeSearchSafeString(canonicalEpisode.title);
					const episodeMatch: IStitcherPodcast | undefined = find(data.episodes, (episode: IStitcherEpisode) => makeSearchSafeString(episode.title) === episodeTitle && episode.show_id === stitcherPodcast.id);
					if (episodeMatch) {
						await PlatformEpisode.findOrCreate({
							where: {
								episodeId: canonicalEpisode.id,
								platformId,
								podcastId: canonicalPodcast.id,
								platformEpisodeId: episodeMatch.slug
							}
						});
					} else {
						console.log(`Could not find a stitcher episode for "${canonicalEpisode.title}"`);
					}
				}
			}
		} else {
			console.log(`Could not find a stitcher podcast for "${canonicalPodcast.title}"`);
		}
	}
}
