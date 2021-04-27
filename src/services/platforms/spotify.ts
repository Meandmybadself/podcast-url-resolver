import axios from "axios";
import { find, some } from "lodash";
import {
  ICanonicalEpisode,
  ICanonicalPodcast,
  IPlatformClient,
  ISearchCriteria,
} from "../../interfaces";
import PlatformEpisode from "../../models/platform-episode";
import PlatformEpisodeURL from "../../models/platform-episode-url";
import PlatformPodcast from "../../models/platform-podcast";
import { makeSearchSafeString, normalizeText } from "../../utilities/string";
import { now } from "../../utilities/time";
import BasePlatformClient from "./base-platform";
import qs from "qs";
import logger from "../../utilities/log";

interface SpotifyResult {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface SpotifyEpisode {
  audio_preview_url: string;
  description: string;
  duration_ms: number;
  explicit: boolean;
  external_urls: Record<string, string>;
  href: string;
  html_description: string;
  id: string;
  images: {
    height: number;
    url: string;
    widht: number;
  };
  is_externally_hosted: boolean;
  is_playable: boolean;
  language: string;
  languages: string[];
  name: string;
  release_date: string;
  release_date_precision: string;
  type: string;
  uri: string;
}

export default class Spotify
  extends BasePlatformClient
  implements IPlatformClient {
  static _token: string;
  static _tokenExpiry: number;
  _id: string;

  constructor() {
    super();
    this._id = "spotify";
  }

  static async getEpisode(
    spotifyPodcastId: string,
    episodeTitle: string,
    offset = 0
  ): Promise<SpotifyEpisode | void> {
    const limit = 50;
    const url = `https://api.spotify.com/v1/shows/${spotifyPodcastId}/episodes?market=US&limit=${limit}&offset=${offset}`;
    const episodeSearchResponse = await Spotify._getWithToken(url);
    const searchEpisodeTitle: string = makeSearchSafeString(episodeTitle);
    if (episodeSearchResponse?.items?.length) {
      const matchingEpisode = find(
        episodeSearchResponse.items,
        (episode) => makeSearchSafeString(episode.name) === searchEpisodeTitle
      );
      if (matchingEpisode) {
        return matchingEpisode;
      }

      return this.getEpisode(spotifyPodcastId, episodeTitle, offset + limit);
    }
  }

  static async _getToken(): Promise<void> {
    const nowish: number = now() - 60;
    const tokenIsValid: boolean =
      (Spotify._tokenExpiry || Number.POSITIVE_INFINITY) > nowish;

    if (Spotify._token && tokenIsValid) {
      return;
    }

    console.log("Getting spotify token.");

    try {
      const headers = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        auth: {
          username: process.env.SPOTIFY_CLIENT_ID,
          password: process.env.SPOTIFY_SECRET,
        },
      };
      const data = {
        grant_type: "client_credentials",
      };

      const response = await axios({
        url: "https://accounts.spotify.com/api/token",
        data: qs.stringify(data),
        headers,
        timeout: 3000,
      });

      const result: SpotifyResult = response?.data;
      Spotify._tokenExpiry = now() + result.expires_in;
      Spotify._token = result.access_token;
      console.log("Received Spotify token.");
    } catch {
      logger.error("Error while getting token from Spotify");
    }
  }

  static async _getWithToken(url: string): Promise<any> {
    await Spotify._getToken();
    if (Spotify._token) {
      try {
        const rsp = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${Spotify._token}`,
          },
        });

        return rsp.data;
      } catch (error: unknown) {
        logger.error(
          "Error while loading Spotify content w/ token",
          url,
          error
        );
      }
    }
  }

  static async fetchPodcastIDByTitle(title: string): Promise<string | void> {
    const url = `https://api.spotify.com/v1/search?type=show&q=${encodeURIComponent(
      title
    )}&decorate_restrictions=false&best_match=false&limit=10&userless=true&market=US`;

    const episodeSearchResponse = await Spotify._getWithToken(url);
    if (episodeSearchResponse) {
      const episodes = episodeSearchResponse.shows.items;
      if (some(episodes)) {
        const matchingPodcast = find(
          episodes,
          (episode) =>
            makeSearchSafeString(episode.name) === makeSearchSafeString(title)
        );
        if (matchingPodcast) {
          return matchingPodcast.id;
        }
      }
    }
  }

  static async fetchPodcastURLByTitle(title: string): Promise<string | void> {
    const podcastId: string | void = await Spotify.fetchPodcastIDByTitle(title);
    if (podcastId) {
      return `https://open.spotify.com/show/${podcastId}`;
    }
  }

  async getSearchCriteriaFromShareURL(
    shareURL: string
  ): Promise<ISearchCriteria | void> {
    // The ID is in the URL.
    // https://open.spotify.com/episode/5HRnuTXDQOz3eRdtKy0Ttq?si=grLMO2UkQ-aJe0rTg8gmqA
    const platformPodcastId = BasePlatformClient.getRegExpMatch(
      shareURL,
      /episode\/([^?]+)/
    );
    if (platformPodcastId) {
      const data = await Spotify._getWithToken(
        `https://api.spotify.com/v1/episodes/${platformPodcastId}?market=US`
      );
      const podcastTitle = normalizeText(data.show.name);
      const episodeTitle = normalizeText(data.name);
      return {
        podcastTitle,
        episodeTitle,
        platformPodcastId,
      };
    }

    this.couldNotFindSearchCriteria(shareURL);
  }

  async fetchPlatformEpisode(
    canonicalPodcast: ICanonicalPodcast,
    canonicalEpisode: ICanonicalEpisode
  ): Promise<void> {
    const platformId: number = await this.getPlatformId();

    // Do we have the episode persisted?
    const platformEpisode: any = await PlatformEpisode.findOne({
      where: {
        platformId,
        canonicalEpisodeId: canonicalEpisode.id,
      },
    });

    if (platformEpisode) {
      return;
    }

    // Do we have the platform podcast persisted?
    let platformPodcast: any = await PlatformPodcast.findOne({
      where: {
        platformId,
        canonicalPodcastId: canonicalPodcast.id,
      },
    });

    if (!platformPodcast) {
      const platformPodcastId = await Spotify.fetchPodcastIDByTitle(
        canonicalPodcast.title
      );
      if (platformPodcastId) {
        platformPodcast = await PlatformPodcast.create({
          platformId,
          platformPodcastId,
          canonicalPodcastId: canonicalPodcast.id,
        }).then((entity) => entity.get({ plain: true }));
      }
    }

    if (platformPodcast) {
      console.log("Found Spotify podcast", platformPodcast.platformPodcastId);
      const platformEpisode = await Spotify.getEpisode(
        platformPodcast.platformPodcastId,
        canonicalEpisode.title
      );

      if (platformEpisode) {
        console.log("Found Spotify episode", platformEpisode.id);
        await PlatformEpisode.create({
          canonicalPodcastId: canonicalPodcast.id,
          platformId,
          canonicalEpisodeId: canonicalEpisode.id,
          platformEpisodeId: platformEpisode.id,
        });

        await PlatformEpisodeURL.create({
          platformId,
          episodeId: canonicalEpisode.id,
          platformEpisodeURL: `https://open.spotify.com/episode/${platformEpisode.id}`,
        });
      }
    }
  }
}
