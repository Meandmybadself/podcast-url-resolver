import {
  Model,
  Column,
  Table,
  BelongsTo,
  ForeignKey,
  Index,
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

type PlatformEpisodeCreationAttributes = Optional<
  PlatformEpisodeAttributes,
  "id"
>;

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
  @Column
  declare canonicalEpisodeId: number;

  // This is necessary for the platforms that don't have notions of podcasts (overcast)
  @BelongsTo(() => CanonicalPodcast)
  declare canonicalPodcast: CanonicalPodcast;

  @ForeignKey(() => CanonicalPodcast)
  @Column
  declare canonicalPodcastId: number;

  @BelongsTo(() => Platform)
  declare platform: Platform;

  @ForeignKey(() => Platform)
  @Column
  declare platformId: number;

  @Column
  @Index
  declare platformEpisodeId: string;
}
export default PlatformEpisode;
