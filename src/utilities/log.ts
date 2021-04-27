import winston from "winston";
import SlackHook from "winston-slack-webhook-transport";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new SlackHook({
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.Console(),
    new SlackHook({
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
    }),
  ],
});

logger.exitOnError = false;

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

process.on("uncaughtException", (ex) => {
  logger.error("Uncaught exception", ex.toString());
});

export default logger;
