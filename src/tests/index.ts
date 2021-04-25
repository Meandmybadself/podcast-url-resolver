import axios, { AxiosResponse } from 'axios';
import api from 'podcast-index-api';
import { PodcastIndexEpisode, PodcastIndexResponse, PodcastIndexFeed } from '../interfaces';

const apiClient: any = api(
  process.env.PODCASTINDEX_KEY,
  process.env.PODCASTINDEX_SECRET
);

const axiosClient = axios.create({
  baseURL: process.env.BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.EPISODES_SECRET}`
  }
});

const randomIntBetween = (min: number, max: number): number => {
  return min + Math.floor(Math.random() * (min - max));
};

const testFeed = async (podcast: PodcastIndexFeed): Promise<boolean> => {
  const { data } = await axiosClient.get(`/podcast/lookup/feed/${podcast.url}`);
  console.log(data);
  return false;
};

(async () => {
  const { episodes } = await apiClient.episodesRandom(200);

  episodes.forEach(async (episode: PodcastIndexEpisode) => {
    // Const { guid, feedId, title, feedTitle } = episode;
    try {
      // Go get the feed.
      // console.log(episode)
      // process.exit()
      const feed: PodcastIndexResponse = await apiClient.podcastsByFeedId(episode.feedId);

      // What can we do w/ the information?
      // - Load podcast by feed.
      // - Load episode by feed / guid
      // - Load by Google Podcast Episode URL
      // - Load by Apple Podcast URL
      switch (randomIntBetween(0, 0)) {
        case 0:
          // await testFeed(podcast, episode);
          break;
      }

      // Console.log(pciFeed.feed);
      // process.exit();
      // const response = axios.get('http://episodes-fm.herokuapp.com/v1/')
    } catch (error: unknown) {
      console.error(error);
    }
  });
})();
