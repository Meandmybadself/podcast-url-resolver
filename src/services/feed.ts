import parsePodcast from "node-podcast-parser";
import axios from "axios";
import { IFeed } from "../interfaces/feed";
import {
  ICanonicalEpisode,
  ICanonicalPodcast,
  ICanonicalPodcastWithEpisodes,
  IFeedEpisode,
} from "../interfaces";
import CanonicalPodcast from "../models/00-canonical-podcast";
import { makeSearchSafeString } from "../utilities/string";
import Category from "../models/00-category";
import CategoryToPodcast from "../models/category-to-podcast";
import CanonicalEpisode from "../models/00-canonical-episode";
import logger from "../utilities/log";
import { identity, pickBy } from "lodash";

export const loadFeed = async (url: string): Promise<IFeed | void> =>
  new Promise((resolve, reject) => {
    axios
      .get(url)
      .then(({ data }) => {
        console.log("Received feed.");
        parsePodcast(data, (error: unknown, feed: any) => {
          if (error) {
            console.log("Error while parsing feed", error);
            reject(error);
            return;
          }

          if (feed) {
            // Don't need the numbers, just the string values.
            feed.categories = Object.values(feed.categories);
            resolve(feed);
            return;
          }
          console.log("No content in feed.");
          reject();
        });
      })
      .catch((error: unknown) => {
        logger.error(`🚨 Error while attempting to load feed: ${url}`);
        reject(error);
      });
  });

export const loadAndUpsertFeed = async (
  feedURL: string
): Promise<ICanonicalPodcastWithEpisodes | void> => {
  try {
    const feed: IFeed | void = await loadFeed(feedURL);
    if (feed) {
      const {
        title,
        description,
        link,
        image: artworkURL,
        language,
        copyright,
        updated,
        explicit,
        author,
        type,
        owner,
        categories,
      } = feed;

      const feedEpisodes: IFeedEpisode[] = feed.episodes.filter(
        (episode) => !!episode.title
      );

      // Don't let falsey values affect query.
      const where = pickBy(
        {
          title,
          searchTitle: makeSearchSafeString(title),
          feedURL,
          description: description?.long,
          artworkURL,
          copyright,
          language,
          author,
          ownerName: owner?.name,
          ownerEmail: owner?.email,
          explicit,
          link: link,
          type: type,
          updated: new Date(updated),
        },
        identity
      );

      const [canonicalPodcast, wasCreated]: [ICanonicalPodcast, boolean] =
        await CanonicalPodcast.findOrCreate({
          where,
          plain: true,
        }).then(([canonicalPodcast, wasCreated]) => [
          canonicalPodcast.get({ plain: true }),
          wasCreated,
        ]);

      if (!wasCreated) {
        // Associate categories w/ pod.
        // First, we need to make sure that the categories exist.
        const categoriesAsArray: string[] = categories;
        const categoryResults: any[] = [];
        await Promise.all(
          categoriesAsArray.map(async (label: string) => {
            let [categoryResult] = await Category.findOrCreate({
              where: {
                label,
              },
            });
            categoryResult = categoryResult.get({ plain: true });
            categoryResults.push(categoryResult);
          })
        );

        // Associate the categories with the podcast.
        await Promise.all(
          categoryResults.map(async (category) =>
            CategoryToPodcast.findOrCreate({
              where: {
                podcastId: canonicalPodcast.id,
                categoryId: category.id,
              },
            })
          )
        );
      }

      // Associate all feed episodes.
      // This is expensive for big podcasts.
      // Mebbe bulk write & then select?
      await CanonicalEpisode.bulkCreate(
        feedEpisodes.map((episode: IFeedEpisode) => {
          const {
            description,
            duration,
            enclosure,
            episodeType,
            guid,
            image: artworkURL,
            published: publishDate,
            title,
          } = episode;

          return pickBy(
            {
              artworkURL,
              description,
              duration,
              enclosureURL: enclosure?.url,
              episodeType,
              guid,
              canonicalPodcastId: canonicalPodcast.id,
              publishDate,
              searchTitle: makeSearchSafeString(title),
              title,
            },
            identity
          );
        }),
        {
          ignoreDuplicates: true
        }
      );

      const episodes = await CanonicalEpisode.findAll({
        where: { canonicalPodcastId: canonicalPodcast.id },
        raw: true,
      });

      return { ...canonicalPodcast, episodes };
    } else {
      console.log("Unable to load feed - loadAndUpsertFeed");
    }
  } catch (e) {
    console.log(e);
    console.log("Unable to parse feed 1", feedURL);
  }
  console.log("Unable to parse feed 2", feedURL);
};
