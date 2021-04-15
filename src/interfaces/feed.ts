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
