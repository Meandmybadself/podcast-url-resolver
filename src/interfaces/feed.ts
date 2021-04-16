import {IFeedEpisode} from './episode';

export interface IFeed {
	title: string;
	description: {
		short: string;
		long: string;
	};
	link: string;
	image: string;
	language: string;
	copyright: string;
	updated: string;
	explicit: boolean;
	author: string;
	owner: {
		name: string;
		email: string;
	};
	type: string;
	episodes: IFeedEpisode[];
	categories: string[];
}

export interface IPodcastIndexPodcast {
	artwork: string;
	author: string;
	categories: Record<number, string>;
	contentType: string;
	crawlErrors: number;
	dead: number;
	description: string;
	generator?: string;
	id: number;
	image: string;
	imageUrlHash: number;
	itunesId: number;
	language: string;
	lastCrawlTime: number;
	lastGoodHttpStatusTime: number;
	lastHttpStatus: 200;
	lastParseTime: number;
	lastUpdateTime: number;
	link?: string;
	locked: number;
	originalUrl: string;
	ownerName: string;
	parseErrors: number;
	title: string;
	type: number;
	url: string;
}

export interface IPodcastIndexSearchResponse {
	feeds: IPodcastIndexPodcast[];
}
