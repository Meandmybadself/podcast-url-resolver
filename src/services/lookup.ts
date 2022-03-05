/* eslint-disable complexity */

import { find, set, omit } from "lodash";
import {
  IPlatformClient,
  ISearchCriteria,
  ICanonicalPodcast,
  ICanonicalEpisode,
  ICanonicalPodcastWithEpisodes,
  IFeedEpisode,
  IPodcastIndexSearchResponse,
  IPodcastIndexPodcast,
} from "../interfaces";
import { loadAndUpsertFeed, loadFeed } from "./feed";
import { makeSearchSafeString } from "../utilities/string";
import CanonicalEpisode from "../models/00-canonical-episode";
import Overcast from "./platforms/overcast";
import Platform from "../models/00-platform";
import PlatformPodcast from "../models/platform-podcast";
import PlatformEpisodeURL from "../models/platform-episode-url";
import PlatformHost from "../models/platform-host";
import CanonicalPodcast from "../models/00-canonical-podcast";
import PodcastIndexAPI from "podcast-index-api";
import normalizeUrl from "normalize-url";
import Apple from "./platforms/apple";
import Spotify from "./platforms/spotify";
import PlatformEpisode from "../models/platform-episode";
import PlatformData from "./platform-data";
import Stitcher from "./platforms/stitcher";
import Pocketcasts from "./platforms/pocketcasts";
import IHeartRadio from "./platforms/iheartradio";

// Instantiate platform clients
const PLATFORM_CLIENTS: Record<string, IPlatformClient> = {
  overcast: new Overcast(),
  apple: new Apple(),
  spotify: new Spotify(),
  stitcher: new Stitcher(),
  pocketcasts: new Pocketcasts(),
  iheartradio: new IHeartRadio(),
};

const podcastIndexAPI = PodcastIndexAPI(
  process.env.PODCASTINDEX_KEY,
  process.env.PODCASTINDEX_SECRET
);

export const lookupEpisodeByShareURL = async (
  platformEpisodeURL: string
): Promise<Partial<ICanonicalEpisode | void>> => {
  let searchCriteria: ISearchCriteria | void;
  let episodes: any;

  platformEpisodeURL = normalizeUrl(platformEpisodeURL);

  // Have we already looked this URL up?
  const existingResult = await getEpisodeByShareURL(platformEpisodeURL);
  if (existingResult) {
    return existingResult;
  }

  // Do we have a service to lookup details for this hostname?
  const { hostname } = new URL(platformEpisodeURL);
  const platform = (
    await PlatformHost.findOne({
      where: {
        hostname,
      },
      include: Platform,
    })
  )?.platform;

  const activePlatforms: {
    [key: string]: IPlatformClient;
  } = await getActivePlatformClients();

  if (platform?.platformId && activePlatforms[platform.platformId]) {
    console.log(`Performing service lookup for ${platform.platformId}`);
    // We have an active lookup service for this hostname.
    const service: IPlatformClient = PLATFORM_CLIENTS[platform.platformId];
    searchCriteria = await service.getSearchCriteriaFromShareURL(
      platformEpisodeURL
    );

    if (searchCriteria) {
      console.log("searchCriteria podcast title", searchCriteria.podcastTitle);
      console.log("searchCriteria episode title", searchCriteria.episodeTitle);

      // We found at minimum, a podcast title & episode title to work with.
      let canonicalPodcast: ICanonicalPodcast | undefined;
      let canonicalEpisode: ICanonicalEpisode | undefined;

      // Did we find a feed URL when looking @ the page?
      if (searchCriteria.feedURL) {
        // Use the feed URL to look up the podcast.
        canonicalPodcast = await CanonicalPodcast.findOne({
          where: { feedURL: searchCriteria.feedURL },
          plain: true,
        });

        if (!canonicalPodcast) {
          // We didn't find a feedURL-based podcast.
          // Do we have a canonical podcast in the db that matches title?
          const searchTitle: string = makeSearchSafeString(
            searchCriteria.podcastTitle
          );
          canonicalPodcast = await CanonicalPodcast.findOne({
            where: { searchTitle },
            plain: true,
          });
        }
      }

      if (!canonicalPodcast) {
        console.log(`Podcastindex lookup: "${searchCriteria.podcastTitle}"`);
        // We don't have a canonical podcast in the db.
        // Let's ask Podcastindex if it knows about this pod.
        const podcastIndexResult: IPodcastIndexSearchResponse =
          await podcastIndexAPI.searchByTerm(searchCriteria.podcastTitle);

        // Get rid of podcasts we can't use.
        if (podcastIndexResult?.feeds?.length) {
          podcastIndexResult.feeds = podcastIndexResult.feeds.filter(
            (feedItem: IPodcastIndexPodcast) =>
              feedItem.locked !== 1 && feedItem.dead !== 1
          );
        }

        if (podcastIndexResult?.feeds?.length) {
          const podcastSearchTitle: string = makeSearchSafeString(
            searchCriteria.podcastTitle
          );
          const podcastTitleMatch: IPodcastIndexPodcast | undefined = find(
            podcastIndexResult.feeds,
            (podcast) =>
              makeSearchSafeString(podcast.title) === podcastSearchTitle
          );

          if (podcastTitleMatch) {
            // We're presuming that the first match is the correct match.
            // If this turns out to not be the case, do some string comparison checking.
            // We only need the feed URL.
            const {
              url,
              itunesId,
            }: {
              url: string;
              itunesId: number;
              id: number;
            } = podcastTitleMatch;
            const podcastWithEpisodes: ICanonicalPodcastWithEpisodes | void =
              await loadAndUpsertFeed(url);

            if (podcastWithEpisodes) {
              canonicalPodcast = omit(podcastWithEpisodes, ["episodes"]);
              episodes = podcastWithEpisodes.episodes;

              if (itunesId) {
                // If an iTunes podcast ID is provided, we might as well toss this in the DB too.
                const platformId: number = (
                  await PlatformData.getPlatformById("apple")
                ).id;
                try {
                  await PlatformPodcast.create({
                    platformPodcastId: itunesId.toString(),
                    platformId,
                    canonicalPodcastId: canonicalPodcast.id,
                  });
                } catch (error: unknown) {
                  console.log(
                    "Could not create iTunes platform podcast",
                    error
                  );
                }
              }
            }
          }
        } else {
          console.warn("Podcastindex returned zero canonical results.");
        }
      }
      if (canonicalPodcast) {
        // We have a canonical record of this podcast in the database.
        // Do we have a canonical record of the episode?
        const episodeSearchTitle: string = makeSearchSafeString(
          searchCriteria.episodeTitle
        );
        canonicalEpisode = await CanonicalEpisode.findOne({
          where: {
            searchTitle: episodeSearchTitle,
            canonicalPodcastId: canonicalPodcast.id,
          },
          plain: true,
        });

        if (!canonicalEpisode) {
          console.log("No canonical episode in DB. Looking up.");
          // No canonical episode.
          // We _should_ have one if we look in the feed episode list.
          // Did we load the feed episode list?

          if (!episodes) {
            // We did not. Load feed.
            const feed = await loadFeed(canonicalPodcast.feedURL);
            if (feed && feed.episodes) {
              // eslint-disable-line @typescript-eslint/prefer-optional-chain
              episodes = feed.episodes;
            }
          }

          const feedCanonicalEpisode: IFeedEpisode | undefined = find(
            episodes,
            {
              title: searchCriteria.episodeTitle,
            }
          );

          if (feedCanonicalEpisode) {
            console.log("Adding canonical episode.");
            try {
              canonicalEpisode = await CanonicalEpisode.create({
                title: feedCanonicalEpisode.title,
                searchTitle: makeSearchSafeString(feedCanonicalEpisode.title),
                canonicalPodcastId: canonicalPodcast.id,
                description: feedCanonicalEpisode.description,
                publishDate: new Date(feedCanonicalEpisode.published),
                episodeType: feedCanonicalEpisode.episodeType,
                duration: feedCanonicalEpisode.duration,
                guid: feedCanonicalEpisode.guid,
                enclosureURL: feedCanonicalEpisode.enclosure.url,
                artworkURL: feedCanonicalEpisode.image,
              }).then((entity) => entity.get({ plain: true }));
            } catch (error: unknown) {
              console.log("Error while inserting podcast.", error);
            }
          }
        }

        if (canonicalPodcast && canonicalEpisode) {
          // We have a canonical version of the podcast and the episode in the database.
          // Add the platform podcasts / episodes.
          const activePlatforms: {
            [key: string]: IPlatformClient;
          } = await getActivePlatformClients();

          await Promise.all(
            Object.values(activePlatforms).map(
              async (client: IPlatformClient) =>
                client.ensurePodcastEpisode(canonicalPodcast, canonicalEpisode)
            )
          );

          // Add the platform episode URL for future lookups.
          await PlatformEpisodeURL.findOrCreate({
            where: {
              platformEpisodeURL,
              episodeId: canonicalEpisode.id,
              platformId: platform.id,
            },
          });
        }

        const result = await getEpisodeByShareURL(platformEpisodeURL);
        if (result) {
          return result;
        }
      }
    }
  }
};

const getEpisodeByShareURL = async (platformEpisodeURL: string) => {
  const episodeURL = await PlatformEpisodeURL.findOne({
    where: {
      platformEpisodeURL,
    },
    include: CanonicalEpisode,
  });

  if (episodeURL) {
    const canonicalEpisode = episodeURL.episode.get({ plain: true });

    if (canonicalEpisode) {
      const canonicalPodcast = (
        await CanonicalPodcast.findOne({
          where: {
            id: canonicalEpisode.canonicalPodcastId,
          },
          plain: true,
        })
      )?.get({ plain: true });

      if (canonicalPodcast) {
        // Associate podcast
        set(canonicalEpisode, "podcast", canonicalPodcast);

        console.log("Looking up third party episodes");

        const thirdPartyEpisodeURLs = await getThirdPartyPlatformEpisodeURLs(
          canonicalPodcast,
          canonicalEpisode
        );

        if (Object.keys(thirdPartyEpisodeURLs).length) {
          set(canonicalEpisode, "thirdPartyEpisodeURLs", thirdPartyEpisodeURLs);

          canonicalEpisode["podcast"] = omit(canonicalEpisode["podcast"], [
            "searchTitle",
            "id",
            "createdAt",
            "updatedAt",
            "deletedAt",
          ]);

          return omit(canonicalEpisode, [
            "createdAt",
            "updatedAt",
            "searchTitle",
            "id",
            "createdAt",
            "updatedAt",
            "deletedAt",
          ]);
        }
      }
    }
  }
};

const getActivePlatformClients = async (): Promise<{
  [key: string]: IPlatformClient;
}> => {
  const clientIds: string[] = await Platform.findAll({
    where: { isActive: true },
    attributes: ["platformId"],
  }).then((platforms) => platforms.map((platform) => platform.platformId));
  const clients: { [key: string]: IPlatformClient } = {};
  clientIds.forEach((clientId: string) => {
    clients[clientId] = PLATFORM_CLIENTS[clientId];
  });
  debugger;
  return clients;
};

export const lookupEpisodeByFeedURLAndGUID = async (
  feedURL: string,
  guid: string
): Promise<Partial<ICanonicalEpisode> | void> => {
  feedURL = normalizeUrl(feedURL);

  // This will ensure that we have a canonical feed in the db.
  const feed: ICanonicalPodcastWithEpisodes | void = await loadAndUpsertFeed(
    feedURL
  );

  if (feed) {
    const canonicalPodcast: ICanonicalPodcast = omit(feed, ["episodes"]);
    const canonicalEpisode: ICanonicalEpisode | undefined = find(
      feed.episodes,
      { guid }
    );

    if (canonicalPodcast && canonicalEpisode) {
      const activePlatforms = await getActivePlatformClients();

      await Promise.all(
        Object.values(activePlatforms).map(async (client: IPlatformClient) =>
          client.ensurePodcastEpisode(canonicalPodcast, canonicalEpisode)
        )
      );

      // We should now have canonical & platform episodes in the database.  Let's return what we've got.
      const thirdPartyURLs = await getThirdPartyPlatformEpisodeURLs(
        canonicalPodcast,
        canonicalEpisode
      );
      set(canonicalEpisode, "thirdPartyURLs", thirdPartyURLs);
    }

    return omit(canonicalEpisode, [
      "canonicalPodcastId",
      "createdAt",
      "deletedAt",
      "id",
      "searchTitle",
      "updatedAt",
    ]);
  }
};

export const lookupPodcastByFeedURL = async (
  feedURL: string
): Promise<Record<string, string>> => {
  feedURL = normalizeUrl(feedURL);

  // Do we have a podcast w/ that feed URL?
  let canonicalPodcast: ICanonicalPodcast | void =
    await CanonicalPodcast.findOne({
      where: { feedURL },
    }).then((entity) => entity?.get({ plain: true }));

  if (!canonicalPodcast) {
    canonicalPodcast = await loadAndUpsertFeed(feedURL);
  }

  if (canonicalPodcast) {
    // We have a canonical podcast in the database.
    // Use the title to look up the platform podcasts
    const title: string = canonicalPodcast.title;
    const thirdPartyFeedURLs = {};
    await Promise.all(
      Object.keys(PLATFORM_CLIENTS).map(async (platformId) => {
        let feedURL: string | void;
        switch (platformId) {
          case "overcast":
            feedURL = await Overcast.fetchPodcastURLByTitle(title);
            break;
          case "apple":
            feedURL = await Apple.fetchPodcastURLByTitle(title);
            break;
          case "spotify":
            feedURL = await Spotify.fetchPodcastURLByTitle(title);
            break;
          case "stitcher":
            feedURL = await Stitcher.fetchPodcastURLByTitle(title);
            break;
          case "pocketcasts":
            feedURL = await Pocketcasts.fetchPodcastURLByTitle(title);
            break;
          case "iheartradio":
            feedURL = await IHeartRadio.fetchPodcastURLByTitle(title);
            break;
          default:
            console.log("Unrecognized platformId", platformId);
            break;
        }

        if (feedURL) {
          thirdPartyFeedURLs[platformId] = feedURL;
        }
      })
    );

    if (Object.keys(thirdPartyFeedURLs).length && canonicalPodcast.feedURL) {
      // Google.
      thirdPartyFeedURLs[
        "google"
      ] = `https://podcasts.google.com/?feed=${Buffer.from(
        canonicalPodcast.feedURL
      ).toString("base64")}`;

      // Podcast Addict.
      thirdPartyFeedURLs[
        "podcastaddict"
      ] = `https://podcastaddict.com/feed/${canonicalPodcast.feedURL.replace(
        /^https?:\/\//m,
        ""
      )}`;
    }

    return thirdPartyFeedURLs;
  }
};

const getThirdPartyPlatformEpisodeURLs = async (
  canonicalPodcast: ICanonicalPodcast,
  canonicalEpisode: ICanonicalEpisode
): Promise<Record<string, string>> => {
  // Associate platform episodes.
  const platformEpisodes = (
    await PlatformEpisode.findAll({
      where: {
        canonicalEpisodeId: canonicalEpisode.id,
      },
      attributes: ["platformEpisodeId", "platformId"],
    })
  ).map((platformEpisode) => platformEpisode.get({ plain: true }));

  const thirdPartyURLs = {};

  await Promise.all(
    platformEpisodes.map(async (platformEpisode) => {
      const platform = await PlatformData.getPlatformByDBId(
        platformEpisode.platformId
      );

      if (!platform) {
        throw new Error(
          `Unable to lookup episode platform: ${platformEpisode.platformId}`
        );
      }

      let platformPodcastId: string;
      switch (platform.platformId) {
        case "overcast":
          thirdPartyURLs[
            platform.platformId
          ] = `https://overcast.fm${platformEpisode.platformEpisodeId}`;
          break;
        case "apple":
          // Look up platform episode id.
          platformPodcastId = (
            await PlatformPodcast.findOne({
              where: {
                platformId: platformEpisode.platformId,
                canonicalPodcastId: canonicalPodcast.id,
              },
            })
          ).platformPodcastId;
          thirdPartyURLs[
            platform.platformId
          ] = `https://podcasts.apple.com/us/podcast/a/id${platformPodcastId}?i=${platformEpisode.platformEpisodeId}`;
          break;
        case "spotify":
          thirdPartyURLs[
            platform.platformId
          ] = `https://open.spotify.com/episode/${platformEpisode.platformEpisodeId}`;
          break;
        case "stitcher":
          platformPodcastId = (
            await PlatformPodcast.findOne({
              where: {
                platformId: platformEpisode.platformId,
                canonicalPodcastId: canonicalPodcast.id,
              },
            })
          ).platformPodcastId;
          thirdPartyURLs[
            platform.platformId
          ] = `https://www.stitcher.com/show/${platformPodcastId}/episode/${platformEpisode.platformEpisodeId}`;
          break;
        case "pocketcasts":
          thirdPartyURLs[
            platform.platformId
          ] = `https://pca.st/episode/${platformEpisode.platformEpisodeId}`;
          break;
        case "podcastaddict":
          thirdPartyURLs[
            platform.platformId
          ] = `https://podcastaddict.com/episode/${platformEpisode.platformEpisodeId}`;
          break;
        case "iheartradio":
          platformPodcastId = (
            await PlatformPodcast.findOne({
              where: {
                platformId: platformEpisode.platformId,
                canonicalPodcastId: canonicalPodcast.id,
              },
            })
          ).platformPodcastId;
          thirdPartyURLs[
            platform.platformId
          ] = `https://www.iheart.com/podcast/${platformPodcastId}/episode/${platformEpisode.platformEpisodeId}/`;
          break;
        default:
          console.log("Unrecognized platform id", platform.platformId);
          break;
      }
    })
  );

  console.log(
    `Found ${Object.keys(thirdPartyURLs).length} third-party episodes`
  );
  if (
    Object.keys(thirdPartyURLs).length &&
    canonicalEpisode.guid &&
    canonicalPodcast.feedURL
  ) {
    thirdPartyURLs["google"] = `https://podcasts.google.com/?feed=${Buffer.from(
      canonicalPodcast.feedURL
    ).toString("base64")}&episode=${Buffer.from(canonicalEpisode.guid).toString(
      "base64"
    )}`;

    // Podcast Addict.
    thirdPartyURLs[
      "podcastaddict"
    ] = `https://podcastaddict.com/feed/${canonicalPodcast.feedURL.replace(
      /^https?:\/\//m,
      ""
    )}/${canonicalEpisode.guid}`;
  }

  return thirdPartyURLs;
};
