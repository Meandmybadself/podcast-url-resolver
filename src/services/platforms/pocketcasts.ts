import axios, { AxiosResponse } from "axios";
import {
  ICanonicalEpisode,
  ICanonicalPodcast,
  IPlatformClient,
  ISearchCriteria,
} from "../../interfaces";
import { makeSearchSafeString, normalizeText } from "../../utilities/string";
import BasePlatformClient from "./base-platform";
import { find } from "lodash";
import PlatformEpisode from "../../models/platform-episode";
import logger from "../../utilities/log";

// interface IPocketCastPodcastSearchResult {
// 	uuid: string;
// 	collection_id: string;
// 	title: string;
// 	author: string;
// 	description: string;
// 	thumbnail: string;
// }

interface IPocketCastEpisodeSearchResult {
  uuid: string;
  title: string;
  url: string;
  file_type: string;
  file_size: number;
  duration: number;
  published: string;
  type: string;
}

export default class Pocketcasts
  extends BasePlatformClient
  implements IPlatformClient {
  _id: string;

  constructor() {
    super();
    this._id = "pocketcasts";
  }

  static async fetchPodcastIdByTitle(title: string): Promise<string | void> {
    try {
      // Const datetime = moment().format('YYYYMMDDHHmmSS')
      // // 20200110233945
      // // 20200116224938
      // console.log({datetime})

      const searchRequest: AxiosResponse = await axios.post(
        "https://refresh.pocketcasts.com/podcasts/search",
        {
          device: "C6ABF416-5E74-4BB0-AE7E-F1431106D358",
          dt: "1",
          l: "en",
          c: "US",
          av: "7.6.1",
          m: "13.1.3",
          q: title,
          v: "1.6",
          datetime: "20200110233945",
          h: "47f9939a5aaf5798f19eb3a68f7036152388a4e8",
        }
      );

      if (searchRequest.data.result?.search_results?.length) {
        return searchRequest.data.result.search_results[0].uuid;
      }

      logger.error(`No podcasts returned from pocket casts search: ${title}`);
    } catch {
      logger.error(`Error while fetching pocket casts podcast - ${title}`);
    }
  }

  static async fetchPodcastURLByTitle(title: string): Promise<string | void> {
    const id: string | void = await Pocketcasts.fetchPodcastIdByTitle(title);
    if (id) {
      return `https://pca.st/podcast/${id}`;
    }

    logger.error(`Could not fetch pocketcast URL by title - ${title}`);
  }

  async getSearchCriteriaFromShareURL(
    shareURL: string
  ): Promise<ISearchCriteria | void> {
    const $ = await BasePlatformClient.getPageDOM(shareURL);
    const title: string[] = $(
      "meta[property='og:title']"
    )[0].attribs.content.split(" - ");
    const podcastTitle = title.pop();
    const episodeTitle = normalizeText(title.join(" - "));
    if (podcastTitle && episodeTitle) {
      return {
        podcastTitle,
        episodeTitle,
      };
    }

    this.couldNotFindSearchCriteria(shareURL);
  }

  async fetchPlatformEpisode(
    canonicalPodcast: ICanonicalPodcast,
    canonicalEpisode: ICanonicalEpisode
  ): Promise<void> {
    const platformId = await this.getPlatformId();

    const platformEpisode = await PlatformEpisode.findOne({
      where: {
        platformId,
        canonicalPodcastId: canonicalPodcast.id,
        canonicalEpisodeId: canonicalEpisode.id,
      },
    });

    if (platformEpisode) {
      return;
    }

    const platformPodcastId:
      | string
      | void = await Pocketcasts.fetchPodcastIdByTitle(canonicalPodcast.title);

    if (platformPodcastId) {
      await this.upsertPlatformPodcast(canonicalPodcast, platformPodcastId);

      const episodeRequest = await BasePlatformClient.getPageData(
        `https://cache.pocketcasts.com/mobile/podcast/full/${platformPodcastId}/0/3/1500`
      );
      if (episodeRequest?.podcast?.episodes?.length) {
        const episodeSearchTitle: string = makeSearchSafeString(
          canonicalEpisode.title
        );
        const matchingEpisode:
          | IPocketCastEpisodeSearchResult
          | undefined = find(
          episodeRequest.podcast.episodes,
          (episode: IPocketCastEpisodeSearchResult) =>
            makeSearchSafeString(episode.title) === episodeSearchTitle
        );

        if (matchingEpisode) {
          await this.upsertPlatformEpisode(
            canonicalPodcast,
            canonicalEpisode,
            matchingEpisode.uuid
          );
        } else {
          logger.error(
            `Could not find a platform episode – pocketcasts - ${canonicalPodcast.title}: ${canonicalEpisode.title}`
          );
        }
      } else {
        logger.error(
          `Could not fetch platform episodes - pocketcasts - ${canonicalPodcast.title}: ${canonicalEpisode.title}`
        );
      }
    }
  }
}
