import { NextFunction, Router } from "express";
import sequelize from "../sequelize";
import jwt from "jsonwebtoken";
import RequestAttempt from "../models/request-attempt";
import moment from "moment";
import User from "../models/user";
import { omit } from "lodash";
import logger from "../utilities/log";
import { EpisodeRequest, EpisodeResponse } from "../utilities/request-response";

interface IUserPayload {
  userId: number;
  role: "admin" | "user" | "tester";
}

export const requiresAuth = async (
  request: EpisodeRequest,
  response: EpisodeResponse,
  next: NextFunction
): Promise<void> => {
  const bearer: string = request.headers.authorization;
  if (process.env.ENV === "local") {
    next();
    return;
  }
  if (bearer?.trim()) {
    const secret: string = bearer.replace(/^Bearer /m, "");

    // Currently, this is just checking for the existence of a non-deleted user
    try {
      const payload: IUserPayload = jwt.verify(secret, process.env.JWT_SECRET);

      const userExists: number = await User.count({
        where: {
          id: payload.userId,
          role: payload.role,
          deletedAt: null,
        },
      });

      if (userExists) {
        switch (payload?.role) {
          case "admin":
          case "user":
            next();
            return;
          case "tester":
            const requestCount: RequestAttempt = await RequestAttempt.findOne({
              where: {
                userId: payload.userId,
                day: moment().format("YYYYMMDD"),
              },
            });

            if (requestCount) {
              // User has accessed system today.
              if (
                requestCount.count >=
                Number.parseInt(process.env.TEST_USER_DAILY_LIMIT, 10)
              ) {
                response
                  .status(429)
                  .json({ message: "Daily rate limit exceeded" });
                return;
              }

              requestCount.count++;
              await requestCount.save();
              next();
              return;
            }

            await RequestAttempt.create({
              userId: payload.userId,
            });

            next();
            return;
          default:
            logger.error("Unknown role type in payload.");
            break;
        }
      }
    } catch (error: unknown) {
      if (error instanceof jwt.JsonWebTokenError) {
        response.status(401).end();
        return;
      }
    }
  }

  response.status(401).end();
};

export const requiresAdmin = async (
  request: EpisodeRequest,
  response: EpisodeResponse,
  next: NextFunction
): Promise<void> => {
  const bearer: string = request.headers.authorization;
  if (bearer?.trim()) {
    const secret: string = bearer.replace(/^Bearer /m, "");
    try {
      const payload: IUserPayload = jwt.verify(secret, process.env.JWT_SECRET);
      const result = await User.count({
        where: {
          id: payload.userId,
          deletedAt: null,
          role: "admin",
        },
      });
      if (result) {
        next();
        return;
      }

      response.status(403).end();
      return;
    } catch (error: unknown) {
      if (error instanceof jwt.JsonWebTokenError) {
        response.status(401).end();
        return;
      }
    }
  }

  response.status(401).end();
};

const routes = (router: Router): void => {
  router.post(
    "/user",
    requiresAdmin,
    async (
      request: EpisodeRequest,
      response: EpisodeResponse
    ): Promise<void> => {
      const { email, role } = request.body;
      try {
        const userResult = await sequelize
          .model("User")
          .create({ email, role })
          .then((entity) => entity.get({ plain: true }));
        const payload: IUserPayload = {
          userId: userResult.id,
          role,
        };

        // Create a jwt secret
        const secret: string = jwt.sign(payload, process.env.JWT_SECRET, {
          algorithm: "HS256",
        });

        const result = {
          ...omit(userResult, ["id", "updatedAt", "createdAt", "deletedAt"]),
          secret,
        };

        response.status(200).json({
          message: "ok",
          result,
        });
        return;
      } catch {
        response.status(400).json({
          message: "error",
          description: "Error while creating user",
        });
        return;
      }
    }
  );
  router.get(
    "/users",
    requiresAdmin,
    async (
      _request: EpisodeRequest,
      response: EpisodeResponse
    ): Promise<void> => {
      const result: any = await sequelize.model("User").findAll({
        attributes: ["email", "role"],
      });

      response.status(200).json({
        message: "ok",
        result,
      });
    }
  );
  router.delete(
    "/user/:id",
    requiresAdmin,
    async (
      request: EpisodeRequest,
      response: EpisodeResponse
    ): Promise<void> => {
      const { id } = request.params;
      const result = await sequelize.model("User").destroy({
        where: {
          id,
        },
      });
      response.status(200).json({
        message: "ok",
        result,
      });
    }
  );
};

export default routes;
