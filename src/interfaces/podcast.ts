import { ICanonicalEpisode } from "./episode";

export interface ICanonicalPodcast {
  id?: number;
  title: string;
  searchTitle: string;
  description: string;
  author: string;
  copyright?: string;
  explicit?: boolean;
  feedURL: string;
  artworkURL: string;
  language: string;
  link?: string;
  ownerEmail?: string;
  ownerName?: string;
  summary?: string;
  type?: string;
  updated?: Date;
}

export interface ICanonicalPodcastWithEpisodes extends ICanonicalPodcast {
  episodes: ICanonicalEpisode[];
}
