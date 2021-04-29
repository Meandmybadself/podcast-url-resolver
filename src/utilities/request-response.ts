import { Request, Response, NextFunction } from "express";

import logger from "./log";

export interface EpisodeRequest extends Request {
  locals: any;
  log: {
    error: (args: any) => void;
    warn: (args: any) => void;
    info: (args: any) => void;
    verbose: (args: any) => void;
    debug: (args: any) => void;
    silly: (args: any) => void;
  };
}

export interface EpisodeResponse extends Response {
  success: (data: any) => Response;
  failure: (description?: string, errorCode?: number) => Response;
  unauthorized: () => Response;
  forbidden: () => Response;
}

export const attachHelpers = (
  request: EpisodeRequest,
  response: EpisodeResponse,
  next: NextFunction
): void => {
  request.locals = {};

  request.log = {
    error(...args) {
      logWithRequestContext("error", args);
    },
    warn(...args) {
      logWithRequestContext("warn", args);
    },
    info(...args) {
      logWithRequestContext("info", args);
    },
    verbose(...args) {
      logWithRequestContext("verbose", args);
    },
    debug(...args) {
      logWithRequestContext("debug", args);
    },
    silly(...args) {
      logWithRequestContext("silly", args);
    },
  };

  function logWithRequestContext(level = "info", args: any = []) {
    logger.log(level, args);
  }

  Object.assign(response, {
    success: (data: any) =>
      response.status(200).json({ status: "ok", ...data }),

    failure: (description = "An error has occurred", errorCode = 400) => {
      request.log.error("An error occurred");
      response.status(errorCode).json({ status: "error", description });
    },

    unauthorized: () => {
      const ip: string | string[] =
        request.headers["x-forwarded-for"] || request.connection.remoteAddress;
      request.log.error(`Unauthorized attempt: ${ip}`); // eslint-disable-line @typescript-eslint/restrict-template-expressions
      response.status(401).end();
    },

    forbidden: () => {
      const ip: string | string[] =
        request.headers["x-forwarded-for"] || request.connection.remoteAddress;
      logger.error(`Forbidden attempt: ${ip}`); // eslint-disable-line @typescript-eslint/restrict-template-expressions
      response.status(403).end();
    },
  });

  next();
};
