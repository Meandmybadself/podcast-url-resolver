import axios, { AxiosInstance, AxiosResponse } from "axios";
import {
  ICanonicalEpisode,
  ICanonicalPodcast,
  IPlatformClient,
  ISearchCriteria,
} from "../../interfaces";
import BasePlatformClient from "./base-platform";
import cheerio from "cheerio";
import Apple from "./apple";
import { normalizeText, makeSearchSafeString } from "../../utilities/string";
import https from "https";
import logger from "../../utilities/log";

/* eslint-disable @typescript-eslint/restrict-template-expressions */
// Go get an auth cookie with a raw https request, like the amish did.
const getAuthCookie = async () =>
  new Promise((resolve, reject) => {
    try {
      const request = https.request(
        {
          host: "overcast.fm",
          path: "/login",
          port: 443,
          method: "POST",
          headers: {
            "user-agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:87.0) Gecko/20100101 Firefox/87.0",
            accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "accept-language": "en-US,en;q=0.5",
            "accept-encoding": "gzip, deflate, br",
            "content-type": "application/x-www-form-urlencoded",
            "content-length": "134",
            origin: "https://overcast.fm",
            dnt: "1",
            referer: "https://overcast.fm/login",
            cookie: "o=-",
            "upgrade-insecure-requests": "1",
            te: "trailers",
          },
        },
        (response) => {
          const authCookie: string | void = BasePlatformClient.getRegExpMatch(
            response.headers["set-cookie"][0],
            /(o=[^;]+)/
          );
          if (authCookie) {
            resolve(authCookie);
            return;
          }

          logger.error("Failed to authenticate with Overcast.");
          reject(new Error("Login to Overcast failed"));
        }
      );

      request.write(
        `then=podcasts&email=${process.env.OVERCAST_EMAIL}&password=${process.env.OVERCAST_PASSWORD}`
      );
      request.end();
    } catch {
      logger.error("Failed to authenticate with Overcast.");
    }
  });

export default class Overcast
  extends BasePlatformClient
  implements IPlatformClient {
  _axiosInstance: AxiosInstance;
  _id: string;

  constructor() {
    super();
    this._id = "overcast";
    void this._performAuth();
  }

  static async fetchPodcastURLByTitle(title: string): Promise<string | void> {
    const applePodcastId: string | void = await Apple.fetchPodcastByTitle(
      title
    );
    if (applePodcastId) {
      return `https://overcast.fm/itunes${applePodcastId}`;
    }
  }

  async _performAuth(): Promise<void> {
    const Cookie = await getAuthCookie();

    this._axiosInstance = axios.create({
      withCredentials: true,
      headers: {
        Cookie,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });

    console.log("🔒 Signed into Overcast");
  }

  async getSearchCriteriaFromShareURL(
    shareURL: string
  ): Promise<ISearchCriteria | void> {
    try {
      const { data } = await this._axiosInstance.get(shareURL);
      const $ = cheerio.load(data);
      const podcastTitle: string = $("h3 > a").text();
      const episodeTitle: string = $("h2").text();

      if (podcastTitle && episodeTitle) {
        return {
          podcastTitle,
          episodeTitle,
        };
      }
    } catch {
      logger.error(`Failed to find Overcast searchCriteria: ${shareURL}`);
    }
  }

  async fetchPlatformEpisode(
    canonicalPodcast: ICanonicalPodcast,
    canonicalEpisode: ICanonicalEpisode
  ): Promise<void> {
    // There isn't any cost-savings in persisting just the podcast id in the db here, because when you query overcast, you get all episodes
    const podcastURL: string | void = await Overcast.fetchPodcastURLByTitle(
      canonicalPodcast.title
    );
    if (podcastURL) {
      let response: AxiosResponse;
      try {
        response = await this._axiosInstance.get(podcastURL);
        const { data } = response;
        const page = cheerio.load(data);
        const episode = page("a.extendedepisodecell")
          .toArray()
          .map((element: any) => ({
            title: normalizeText(cheerio(element).find(".title").text()),
            overcastId: element.attribs.href,
            overcastURL: `https://overcast.fm${element.attribs.href}`,
          }))
          .find(
            (element: any) =>
              makeSearchSafeString(element.title) ===
              makeSearchSafeString(canonicalEpisode.title)
          );

        if (episode) {
          await this.upsertPlatformEpisode(
            canonicalPodcast,
            canonicalEpisode,
            episode.overcastId
          );
          await this.upsertPlatformEpisodeURL(
            canonicalEpisode,
            episode.overcastURL
          );
        } else {
          console.log("Did not find an overcast episode");
          const finalURL: string =
            response?.request?.res.responseUrl || "unknown";
          console.log(`URL: ${finalURL}`);
        }
      } catch {
        const finalURL: string =
          response?.request?.res.responseUrl || "unknown";
        logger.error(
          `Error while trying to fetch Overcast episode - ${canonicalPodcast.title}: ${canonicalEpisode.title} - ${finalURL}`
        );
        /* eslint-enable @typescript-eslint/restrict-template-expressions */
      }
    }
  }
}
