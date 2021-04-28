import * as Sentry from "@sentry/node";
// import * as Tracing from '@sentry/tracing';

console.log(`🎧 Episodes.fm - ${process.env.ENV}`);

import sequelize from "./sequelize"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { initExpress } from "./express";

import jwt from "jsonwebtoken";
import User from "./models/user";

Sentry.init({
  dsn:
    "https://e256dc0c0a1f40ac987a9b0ad07a0539@o26103.ingest.sentry.io/5739794",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

(async () => {
  const transaction = Sentry.startTransaction({
    op: "test",
    name: "My First Test Transaction",
  });

  try {
    initExpress();

    if (process.env.LOG_USERS === "1") {
      // Log user JWTs
      (await User.findAll())
        .map((user) => user.get({ plain: true }))
        .forEach((user) => {
          const payload = {
            userId: user.id,
            role: user.role,
          };
          const secret = jwt.sign(payload, process.env.JWT_SECRET, {
            algorithm: "HS256",
          });

          console.log(user.email, secret);
        });
    }
  } catch (error: unknown) {
    Sentry.captureException(error);
    console.error(error);
  } finally {
    transaction.finish();
  }
})();
