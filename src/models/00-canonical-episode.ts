import {
  Model,
  Column,
  Table,
  BelongsTo,
  Default,
  ForeignKey,
  AllowNull,
  Index,
} from "sequelize-typescript";
import { DataTypes, Optional } from "sequelize";
import CanonicalPodcast from "./00-canonical-podcast";
import { ICanonicalEpisode } from "../interfaces";

type EpisodeCreationAttributes = Optional<ICanonicalEpisode, "id">;

@Table({
  paranoid: true,
})
class CanonicalEpisode extends Model<
  ICanonicalEpisode,
  EpisodeCreationAttributes
> {
  @Index
  @Column
  title!: string;

  @Index
  @Column
  searchTitle!: string;

  @BelongsTo(() => CanonicalPodcast)
  canonicalPodcast: CanonicalPodcast;

  @ForeignKey(() => CanonicalPodcast)
  canonicalPodcastId: number;

  @Column({
    type: DataTypes.TEXT,
  })
  description!: string;

  @Index
  @Column({
    type: DataTypes.TEXT,
  })
  guid: string;

  @AllowNull
  @Default(-1)
  @Column
  duration?: number;

  @AllowNull
  @Column({
    type: DataTypes.TEXT,
  })
  artworkURL?: string;

  @Column
  publishDate: Date;

  @AllowNull
  @Column
  episodeType?: string;

  @Column({
    type: DataTypes.TEXT,
  })
  enclosureURL?: string;
}
export default CanonicalEpisode;
