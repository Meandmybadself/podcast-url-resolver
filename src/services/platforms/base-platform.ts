import axios from "axios";
import cheerio from "cheerio";
import {
  ICanonicalEpisode,
  ICanonicalPodcast,
  IPlatform,
  IPlatformClient,
  ISearchCriteria,
} from "../../interfaces";
import PlatformEpisode from "../../models/platform-episode";
import logger from "../../utilities/log";
import PlatformData from "../platform-data";
import https from "https";

export default class BasePlatformClient implements IPlatformClient {
  _id: string;

  static async getPageData(url: string): Promise<any> {
    try {
      return (
        await axios({
          method: "GET",
          url,
          httpsAgent: new https.Agent({
            rejectUnauthorized: false,
          }),
        })
      ).data;
    } catch {
      logger.error(`🚨 Error while attempting to load: ${url}`);
    }
  }

  static async getPageDOM(url: string): Promise<any> {
    const data = await BasePlatformClient.getPageData(url);
    if (data) {
      return cheerio.load(data);
    }
  }

  static getRegExpMatch(string: string, regex: RegExp): string | void {
    const matches = regex.exec(string);

    if (matches?.[1]) {
      return matches[1];
    }

    logger.error("Unable to find a regex match.", string);
  }

  async getPlatform(): Promise<IPlatform | null> {
    return PlatformData.getPlatformById(this._id);
  }

  async getPlatformId(): Promise<number | null> {
    return (await this.getPlatform()).id;
  }

  /* eslint-disable @typescript-eslint/require-await */
  async getSearchCriteriaFromShareURL(
    _url: string
  ): Promise<ISearchCriteria | void> {
    // Tries to find an empirical episode / podcast title given a URL.
    // This base method attempts to find them via RSS feed.
    throw new Error(
      "getSearchCriteriaFromShareURL needs to be overridden. Is being called in BasePlatform"
    );
  }

  async fetchPodcastByTitle(_title: string): Promise<void> {
    throw new Error(
      "fetchPodcastByTitle needs to be overridden and was called in BasePlatform"
    );
  }

  async fetchPlatformEpisode(
    _canonicalPodcast: ICanonicalPodcast,
    _canonicalEpisode: ICanonicalEpisode
  ): Promise<void> {
    throw new Error(
      "this._fetchPlatformEpisodes needs to be overridden and was called in BasePlatform"
    );
  }

  /* eslint-enable @typescript-eslint/require-await */

  async ensurePodcastEpisode(
    canonicalPodcast: ICanonicalPodcast,
    canonicalEpisode: ICanonicalEpisode
  ): Promise<any> {
    const platformId: number = await this.getPlatformId();
    // console.log('ensurePodcastEpisode', this._id);
    // See if we already have the platform episode.
    const ep = await PlatformEpisode.findOne({
      where: {
        canonicalEpisodeId: canonicalEpisode.id,
        canonicalPodcastId: canonicalPodcast.id,
        platformId,
      },
    });
    if (ep) {
      return;
    }

    return this.fetchPlatformEpisode(canonicalPodcast, canonicalEpisode);
  }

  couldNotFindSearchCriteria(searchURL: string): void {
    logger.error(`Could not find search criteria - ${this._id}: ${searchURL}`);
  }

  couldNotFetchPodcast(canonicalPodcast: ICanonicalPodcast): void {
    logger.error(
      `Could not fetch episode - ${this._id} - "${canonicalPodcast.title}"`
    );
  }

  couldNotFetchEpisode(canonicalEpisode: ICanonicalEpisode): void {
    logger.error(
      `Could not fetch episode - ${this._id} - "${canonicalEpisode.title}"`
    );
  }

  couldNotFetchPodcastByTitle(title: string): void {
    logger.error(`Could not fetch podcast by title - ${this._id} - "${title}"`);
  }
}
