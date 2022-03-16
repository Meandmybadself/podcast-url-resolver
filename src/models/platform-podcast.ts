import {
  Model,
  Column,
  Table,
  BelongsTo,
  ForeignKey,
  Unique,
} from "sequelize-typescript";
import { Optional } from "sequelize/types";
import Platform from "./00-platform";
import CanonicalPodcast from "./00-canonical-podcast";

export interface IPlatformPodcast {
  id: number;
  platformId: number;
  canonicalPodcastId: number;
  platformPodcastId: string;
}

interface PlatformPodcastCreationAttributes
  extends Optional<IPlatformPodcast, "id"> { }

@Table({
  paranoid: true,
})
class PlatformPodcast extends Model<
IPlatformPodcast,
PlatformPodcastCreationAttributes
> {
  @BelongsTo(() => Platform)
  declare platform: Platform;

  @ForeignKey(() => Platform)
  declare platformId: number;

  @BelongsTo(() => CanonicalPodcast)
  declare canonicalPodcast: CanonicalPodcast;

  @ForeignKey(() => CanonicalPodcast)
  declare canonicalPodcastId: number;

  @Unique
  @Column
  declare platformPodcastId: string;
}

export default PlatformPodcast;
