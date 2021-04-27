import { Router } from "express";
import {
  lookupEpisodeByFeedURLAndGUID,
  lookupEpisodeByShareURL,
} from "../services/lookup";
import { EpisodeRequest, EpisodeResponse } from "../utilities/request-response";
import { requiresAuth } from "./user";

const routes = (router: Router): void => {
  router.get(
    "/episode/lookup/url/:url(*)",
    requiresAuth,
    async (request: EpisodeRequest, response: EpisodeResponse) => {
      // This is to catch stuff in a query string.  Params doesn't provide that.
      const parameters = request.originalUrl.replace(
        "/v1/episode/lookup/url/",
        ""
      );
      const episode = await lookupEpisodeByShareURL(parameters);
      response.success({ episode });
    }
  );

  router.get(
    "/episode/lookup/feed/:feedAndGUID(*)",
    requiresAuth,
    async (
      request: EpisodeRequest,
      response: EpisodeResponse
    ): Promise<void> => {
      const feedAndGUID = request.originalUrl.replace(
        "/v1/episode/lookup/feed/",
        ""
      );
      if (feedAndGUID) {
        const [feedURL, guid] = feedAndGUID.split("@");
        const episode = await lookupEpisodeByFeedURLAndGUID(feedURL, guid);
        response.success({ episode });
        return;
      }
      response.failure();
    }
  );
};

export default routes;
