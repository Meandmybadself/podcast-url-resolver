import axios, { AxiosResponse } from "axios";
import api from "podcast-index-api";
import { PodcastIndexEpisode, PodcastIndexResponse } from "../interfaces";

const piClient: any = api(
  process.env.PODCASTINDEX_KEY,
  process.env.PODCASTINDEX_SECRET
);

const fmClient = axios.create({
  baseURL: process.env.TESTING_URL,
  headers: {
    Authorization: `Bearer ${process.env.TESTING_JWT}`,
  },
});

const testFeed = async (): Promise<void> => {
  const TESTING_EPISODE_COUNT = 1;
  // console.info(`Fetching ${TESTING_EPISODE_COUNT} random episodes from podcast index.`)
  const { episodes } = await piClient.episodesRandom(TESTING_EPISODE_COUNT);
  // console.info(`Received ${episodes.length} episodes from podcast index.`)

  await Promise.all(
    episodes.map(
      async (episode: PodcastIndexEpisode): Promise<void> => {
        const { id, guid, feedId, title, feedTitle } = episode;
        try {
          // Go get the feed.
          // console.log(episode)
          // process.exit()
          const feed: PodcastIndexResponse = await piClient.podcastsByFeedId(
            feedId
          );

          // We now have feed URLs as well as GUIDs.
          // Let's use that to query for third-party episodes.
          const EPISODES_URL = `/episode/lookup/feed/${feed.feed?.url}@${guid}`;
          console.log(
            `Fetching Episode FM episodes: http://localhost:8000/v1${EPISODES_URL}`
          );

          const response: AxiosResponse = await fmClient.get(EPISODES_URL);

          if (response?.data?.episode?.thirdPartyURLs) {
            console.log(
              `✅ Found ${
                Object.keys(response.data.episode.thirdPartyURLs).length
              } third party episodes`
            );
          } else {
            console.log(`🟥 Did not find any third party episodes. Details:`);
            console.log(`Episode id: ${id}`);
            console.log(`Episode guid: ${guid}`);
            console.log(`Episode feed id: ${feedId}`);
            console.log(`Episode title: ${title}`);
            console.log(`Feed title: ${feedTitle}`);
            console.log(`Feed url: ${feed.feed.url}`);
            console.log(response.data);
          }
        } catch (error: unknown) {
          console.error(error);
        }
      }
    )
  );

  setTimeout(() => testFeed(), 1500);
};

(() => {
  setTimeout(() => testFeed(), 1500);
})();
