import {
  Model,
  Column,
  Table,
  BelongsTo,
  Default,
  ForeignKey,
  AllowNull,
  Index,
  Unique,
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
  declare title: string;

  @Index
  @Column
  declare searchTitle: string;

  @BelongsTo(() => CanonicalPodcast)
  declare canonicalPodcast: CanonicalPodcast;

  @ForeignKey(() => CanonicalPodcast)
  declare canonicalPodcastId: number;

  @Column({
    type: DataTypes.TEXT,
  })
  declare description: string;

  @Index
  @Unique
  @Column({
    type: DataTypes.TEXT,
  })
  declare guid: string;

  @AllowNull
  @Default(-1)
  @Column
  declare duration?: number;

  @AllowNull
  @Column({
    type: DataTypes.TEXT,
  })
  declare artworkURL?: string;

  @Column
  declare publishDate: Date;

  @AllowNull
  @Column
  declare episodeType?: string;

  @Column({
    type: DataTypes.TEXT,
  })
  declare enclosureURL?: string;
}
export default CanonicalEpisode;
