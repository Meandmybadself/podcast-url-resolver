import {
  Model,
  Column,
  Table,
  Unique,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { Optional } from "sequelize/types";
import Platform from "./00-platform";

interface PlatformHostAttributes {
  id: number;
  hostname: string;
  platformId: number;
}

type PlatformHostCreationAttributes = Optional<PlatformHostAttributes, "id">;

@Table({
  timestamps: false,
  paranoid: true,
})
class PlatformHost extends Model<
  PlatformHostAttributes,
  PlatformHostCreationAttributes
> {
  @Unique
  @Column
  declare hostname: string;

  @BelongsTo(() => Platform)
  platform: Platform;

  @ForeignKey(() => Platform)
  @Column
  declare platformId: number;
}
export default PlatformHost;
