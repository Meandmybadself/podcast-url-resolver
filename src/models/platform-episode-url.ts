import {
  Model,
  Column,
  Table,
  BelongsTo,
  ForeignKey,
  Unique,
} from "sequelize-typescript";
import { Optional } from "sequelize/types";
import CanonicalEpisode from "./00-canonical-episode";
import Platform from "./00-platform";

interface PlatformEpisodeURLAttributes {
  id: number;
  episodeId: number;
  platformId: number;
  platformEpisodeURL: string;
}

type PlatformEpisodeURLCreationAttributes = Optional<
  PlatformEpisodeURLAttributes,
  "id"
>;

@Table({
  timestamps: true,
  paranoid: true,
})
class PlatformEpisodeURL extends Model<
  PlatformEpisodeURLAttributes,
  PlatformEpisodeURLCreationAttributes
> {
  @Unique
  @Column
  declare platformEpisodeURL: string;

  @BelongsTo(() => CanonicalEpisode)
  declare episode: CanonicalEpisode;

  @ForeignKey(() => CanonicalEpisode)
  @Column
  declare episodeId: number;

  @BelongsTo(() => Platform)
  declare platform: Platform;

  @ForeignKey(() => Platform)
  declare platformId: number;
}
export default PlatformEpisodeURL;
