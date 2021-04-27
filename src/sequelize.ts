import { Sequelize } from "sequelize-typescript";
import path from "path";
import Platform from "./models/00-platform";
import PlatformHost from "./models/platform-host";
import User from "./models/user";

const sequelize = new Sequelize({
  dialect: "postgres",
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  logging: process.env.SILENT !== "1",
  models: [path.resolve(__dirname, "models")],
});

const initializeBaseTables = async () => {
  console.log("🖋️  Initializing base tables.");
  try {
    await Platform.create({ name: "Overcast", platformId: "overcast" });
    await Platform.create({ name: "Apple Podcasts", platformId: "apple" });
    await Platform.create({ name: "Spotify", platformId: "spotify" });
    await Platform.create({ name: "Stitcher", platformId: "stitcher" });
    await Platform.create({ name: "Pocket Casts", platformId: "pocketcasts" });
    await Platform.create({
      name: "Podcast Addict",
      platformId: "podcastaddict",
      isActive: false,
    });
    await Platform.create({ name: "iHeartRadio", platformId: "iheartradio" });

    await PlatformHost.create({ hostname: "overcast.fm", platformId: 1 });
    await PlatformHost.create({
      hostname: "podcasts.apple.com",
      platformId: 2,
    });
    await PlatformHost.create({ hostname: "open.spotify.com", platformId: 3 });
    await PlatformHost.create({ hostname: "www.stitcher.com", platformId: 4 });
    await PlatformHost.create({ hostname: "stitcher.com", platformId: 4 });
    await PlatformHost.create({ hostname: "pocketcasts.com", platformId: 5 });
    await PlatformHost.create({ hostname: "pca.st", platformId: 5 });
    await PlatformHost.create({ hostname: "podcastaddict.com", platformId: 5 });
    await PlatformHost.create({ hostname: "iheart.com", platformId: 6 });

    await User.create({ email: "meandmybadself@gmail.com", role: "admin" });
    await User.create({ email: "hello@nathangathright.com", role: "admin" });
  } catch {
    console.log("🚨 Error while initializing database. Exiting.");
    process.exit();
  }
};

(async () => {
  await sequelize.authenticate();
  console.info("🔌 Connected to database.");

  if (process.env.DB_INIT_BASE_TABLES === "1") {
    await sequelize.sync({ force: true });
    await initializeBaseTables();
  } else {
    console.log("Altering tables.");
    await sequelize.sync({ alter: true });
  }

  if (process.env.PREPUSH_CHECK) {
    console.log("✅ prepush check - Successfully started. Exiting.");
    process.exit();
  }
})();

export default sequelize;
