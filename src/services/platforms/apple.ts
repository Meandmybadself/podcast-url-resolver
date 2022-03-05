import {
  ICanonicalEpisode,
  ICanonicalPodcast,
  IPlatformClient,
  ISearchCriteria,
} from "../../interfaces";
import BasePlatformClient from "./base-platform";
import { some, find } from "lodash";
import { makeSearchSafeString } from "../../utilities/string";
import logger from "../../utilities/log";

interface IAppleLookupResponse {
  resultCount: number;
  results: IAppleLookupResult[];
}

interface IAppleLookupResult {
  wrapperType: string;
  kind: string;
  artistId: number;
  collectionId: number;
  trackId: number;
  artistName: string;
  collectionName: string;
  trackName: string;
  collectionCensoredName: string;
  trackCensoredName: string;
  artistViewUrl: string;
  collectionViewUrl: string;
  feedUrl: string;
  trackViewUrl: string;
  artworkUrl30: string;
  artworkUrl60: string;
  artworkUrl100: string;
  collectionPrice: number;
  trackPrice: number;
  trackRentalPrice: number;
  collectionHdPrice: number;
  trackHdPrice: number;
  trackHdRentalPrice: number;
  releaseDate: Date;
  collectionExplicitness: string;
  trackExplicitness: string;
  trackCount: number;
  country: string;
  currency: string;
  primaryGenreName: string;
  contentAdvisoryRating: string;
  artworkUrl600: string;
  genreIds: string[];
  genres: string[];
}

export default class Apple
  extends BasePlatformClient
  implements IPlatformClient
{
  // _id: string;

  constructor() {
    super();
    this._id = "apple";
  }

  static async fetchPodcastURLByTitle(title: string): Promise<string | void> {
    const podcastId: string | void = await Apple.fetchPodcastByTitle(title);
    if (podcastId) {
      return `https://podcasts.apple.com/us/podcast/listing/id${podcastId}`;
    }
  }

  static async fetchPodcastByTitle(title: string): Promise<string | void> {
    // Apple podcast search
    const { results } = await BasePlatformClient.getPageData(
      `https://itunes.apple.com/search?term=${encodeURIComponent(
        title
      )}&limit=1&media=podcast`
    );
    if (some(results)) {
      return results[0].collectionId;
    }
  }

  async getSearchCriteriaFromShareURL(
    shareURL: string
  ): Promise<ISearchCriteria | void> {
    try {
      const data: string = (
        await BasePlatformClient.getPageData(shareURL)
      ).toString();
      const episodeTitle: string | void = BasePlatformClient.getRegExpMatch(
        `${data}`,
        /AudioObject","name":"([^"]+)"/
      );
      const podcastTitle: string | void = BasePlatformClient.getRegExpMatch(
        `${data}`,
        /isPartOf":"([^"]+)/
      );

      const matches = /id(\d+)\?i=(\d+)/.exec(shareURL);
      if (matches) {
        const [, platformPodcastId, platformEpisodeId] = matches;
        if (episodeTitle && podcastTitle) {
          return {
            platformEpisodeId,
            platformPodcastId,
            podcastTitle,
            episodeTitle,
          };
        }
      }
    } catch {
      logger.error("Error while getting apple search criteria");
    }
    this.couldNotFindSearchCriteria(shareURL);
  }

  async lookupAppleItem(appleId: string): Promise<IAppleLookupResult | void> {
    const url = `https://itunes.apple.com/lookup?id=${appleId}`;
    const data: IAppleLookupResponse = await BasePlatformClient.getPageData(
      url
    );
    const { results } = data;
    if (some(results)) {
      return results[0];
    }
  }

  async fetchPlatformEpisode(
    canonicalPodcast: ICanonicalPodcast,
    canonicalEpisode: ICanonicalEpisode
  ): Promise<void> {
    // There isn't any cost-savings in persisting just the podcast id here, because when you query apple, you get all episodes
    const platformPodcastId: string | void = await Apple.fetchPodcastByTitle(
      canonicalPodcast.title
    );

    if (platformPodcastId) {
      await this.upsertPlatformPodcast(canonicalPodcast, platformPodcastId);

      // Apple episode search
      const url = `http://itunes.apple.com/lookup?id=${platformPodcastId}&entity=podcastEpisode&limit=200`;
      const data: IAppleLookupResponse = await BasePlatformClient.getPageData(
        url
      );
      const results = data.results
        .filter((result: any) => result.kind !== "podcast") // This means it's the podcast itself.
        .map((result) => ({
          ...result,
          searchTitle: makeSearchSafeString(result.trackName),
        }));

      // Find our episode.
      const episode: IAppleLookupResult = find(results, {
        searchTitle: canonicalEpisode.searchTitle,
      });
      if (episode) {
        const platformEpisodeId: string = episode.trackId.toString();
        await this.upsertPlatformEpisode(
          canonicalPodcast,
          canonicalEpisode,
          platformEpisodeId
        );
        await this.upsertPlatformEpisodeURL(
          canonicalEpisode,
          `https://podcasts.apple.com/us/podcast/id${platformPodcastId}?i=${platformEpisodeId}`
        );
      } else {
        this.couldNotFetchEpisode(canonicalEpisode);
      }
    } else {
      this.couldNotFetchPodcast(canonicalPodcast);
    }
  }
}
