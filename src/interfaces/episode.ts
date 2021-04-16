export interface ICanonicalEpisode {
	id?: number;
	artworkURL?: string;
	description: string;
	duration: number;
	enclosureURL?: string;
	episodeType?: string;
	guid: string;
	podcastId: number;
	publishDate: Date;
	searchTitle: string;
	title: string;
	link?: string;
}

export interface IFeedEpisode {
	categories?: string[];
	description: string;
	duration: number;
	enclosure: {
		filesize: number;
		type: string;
		url: string;
	};
	episodeType: string;
	explicit?: string;
	guid: string;
	image: string;
	published: Date;
	title: string;
}
