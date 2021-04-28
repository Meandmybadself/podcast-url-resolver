import { Router } from "express";
import sequelize from "../sequelize";
import { EpisodeRequest, EpisodeResponse } from "../utilities/request-response";
import { requiresAuth } from "./user";

const routes = (router: Router): void => {
  router.get(
    "/platforms",
    requiresAuth,
    async (
      _request: EpisodeRequest,
      response: EpisodeResponse
    ): Promise<void> => {
      const result: any = await sequelize
        .model("Platform")
        .findAll({ attributes: ["name", "platformId"] });

      result.push({
        name: "Google Podcasts",
        id: "google",
      });

      result.push({
        name: "Podcast Addict",
        id: "podcastaddict",
      });

      response.success({ result });
    }
  );
};

export default routes;
