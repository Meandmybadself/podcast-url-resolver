import {ICanonicalEpisode} from './episode';
import {ICanonicalPodcast} from './podcast';
import {ISearchCriteria} from './search-criteria';

export interface IPlatformClient {
	_id: string;
	getSearchCriteriaFromShareURL(url: string): Promise<ISearchCriteria | void>;
	getSearchCriteriaFromEpisodeId?(id: string): Promise<ISearchCriteria | void>;
	ensurePodcastEpisode(canonicalPodcast: ICanonicalPodcast, canonicalEpisode: ICanonicalEpisode): Promise<void>;
	// These are static.
	// fetchPodcastURLByTitle(title: string): Promise<any>;
	// fetchPlatformEpisode?(canonicalPodcast: any, canonicalEpisode: any): Promise<void>;
}

export interface IPlatform {
	id: number;
	name: string;
	platformId: string;
	isActive?: boolean;
}
