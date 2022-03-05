import {
  Model,
  Column,
  Table,
  BelongsTo,
  ForeignKey,
  Index,
  NotNull,
} from "sequelize-typescript";
import { Optional } from "sequelize";
import CanonicalEpisode from "./00-canonical-episode";
import Platform from "./00-platform";
import CanonicalPodcast from "./00-canonical-podcast";

interface PlatformEpisodeAttributes {
  id: number;
  canonicalEpisodeId: number;
  canonicalPodcastId: number;
  platformId: number;
  platformEpisodeId: string;
}

interface PlatformEpisodeCreationAttributes
  extends Optional<PlatformEpisodeAttributes, "id"> {}

@Table({
  paranoid: true,
})
class PlatformEpisode extends Model<
  PlatformEpisodeAttributes,
  PlatformEpisodeCreationAttributes
> {
  @BelongsTo(() => CanonicalEpisode)
  declare canonicalEpisode: CanonicalEpisode;

  @ForeignKey(() => CanonicalEpisode)
  declare canonicalEpisodeId: number;

  // This is necessary for the platforms that don't have notions of podcasts (overcast)
  @BelongsTo(() => CanonicalPodcast)
  declare canonicalPodcast: CanonicalPodcast;

  @ForeignKey(() => CanonicalPodcast)
  declare canonicalPodcastId: number;

  @BelongsTo(() => Platform)
  declare platform: Platform;

  @ForeignKey(() => Platform)
  declare platformId: number;

  @Column
  @Index
  declare platformEpisodeId: string;
}
export default PlatformEpisode;
