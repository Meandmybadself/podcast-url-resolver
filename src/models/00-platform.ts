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

type PlatformCreationAttributes = Optional<IPlatform, "id">;

@Table({
  timestamps: false,
  paranoid: true,
})
class Platform extends Model<IPlatform, PlatformCreationAttributes> {
  @Unique
  @Column
  declare name: string;

  // Unique string id representative of platform ('apple', 'overcast')
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
