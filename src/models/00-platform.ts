import {
  Model,
  Column,
  Table,
  Unique,
  Index,
  Default,
  HasMany,
} from "sequelize-typescript";
import { Optional } from "sequelize/types";
import PlatformHost from "./platform-host";
import { IPlatform } from "../interfaces";

interface PlatformCreationAttributes extends Optional<IPlatform, "id"> {}

@Table({
  timestamps: false,
  paranoid: true,
})
class Platform extends Model<IPlatform, PlatformCreationAttributes> {
  @Unique
  @Column
  declare name: string;

  @Unique
  @Column
  declare platformId: string;

  @Index
  @Default(true)
  @Column
  declare isActive: boolean;

  @HasMany(() => PlatformHost)
  platformHosts: PlatformHost[];
}
export default Platform;
