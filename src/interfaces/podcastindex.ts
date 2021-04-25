export interface PodcastIndexResponse {
	status: string;
	episodes?: PodcastIndexEpisode[];
	feed?: PodcastIndexFeed;
	count: number;
	max: string;
	description: string;
}

export interface PodcastIndexEpisode {
	id: number;
	title: string;
	link: string;
	description: string;
	guid: string;
	datePublished: number;
	datePublishedPretty: string;
	dateCrawled: number;
	enclosureUrl: string;
	enclosureType: string;
	enclosureLength: number;
	explicit: number;
	episode: null;
	episodeType: string;
	season: number;
	image: string;
	feedItunesId: number;
	feedImage: string;
	feedId: number;
	feedTitle: string;
	feedLanguage: string;
	categories: Record<string, string>;
	chaptersUrl: null;
}

export interface PodcastIndexFeed {
	id: number;
	title: string;
	url: string;
	originalUrl: string;
	link: string;
	description: string;
	author: string;
	ownerName: string;
	image: string;
	artwork: string;
	lastUpdateTime: number;
	lastCrawlTime: number;
	lastParseTime: number;
	lastGoodHttpStatusTime: number;
	lastHttpStatus: number;
	contentType: string;
	itunesId: number;
	generator: null;
	language: string;
	type: number;
	dead: number;
	chash: string;
	episodeCount: number;
	crawlErrors: number;
	parseErrors: number;
	categories: Record<string, string>;
	locked: number;
	imageUrlHash: number;
}
