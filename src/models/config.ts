import { Model, Column, Table, Unique } from "sequelize-typescript";

@Table({
  paranoid: true,
  timestamps: false,
})
class Config extends Model<Config> {
  @Unique
  @Column
  declare key: string;

  @Column
  declare value: string;
}

export default Config;
