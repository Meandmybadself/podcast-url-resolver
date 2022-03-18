import {
  Model,
  Column,
  Table,
  HasMany,
  Default,
  Index,
  AllowNull,
  Unique,
} from "sequelize-typescript";
import { Optional, DataTypes } from "sequelize";

import CanonicalEpisode from "./00-canonical-episode";
import { ICanonicalPodcast } from "../interfaces";

type PodcastCreationAttributes = Optional<ICanonicalPodcast, "id">;

@Table({
  paranoid: true,
})
class CanonicalPodcast extends Model<
  ICanonicalPodcast,
  PodcastCreationAttributes
> {
  @Index
  @Unique
  @Column
  declare title: string;

  @Index
  @Column
  declare searchTitle: string;

  @Column({
    type: DataTypes.TEXT,
  })
  declare description: string;

  @Column
  declare language: string;

  @Index
  @Unique
  @Column({
    type: DataTypes.TEXT,
  })
  declare feedURL: string;

  @AllowNull
  @Column
  declare explicit: boolean;

  @AllowNull
  @Column
  declare copyright?: string;

  @Column({
    type: DataTypes.TEXT,
  })
  declare artworkURL: string;

  @Column
  declare author: string;

  @AllowNull
  @Column
  declare ownerName?: string;

  @AllowNull
  @Column
  declare ownerEmail?: string;

  @AllowNull
  @Column
  declare link: string;

  @Column
  declare updated: Date;

  @AllowNull
  @Column
  declare type: string;

  @HasMany(() => CanonicalEpisode)
  episodes: CanonicalEpisode[];

  @Default(Date.now())
  @Column
  declare lastChecked: Date;
}

export default CanonicalPodcast;
