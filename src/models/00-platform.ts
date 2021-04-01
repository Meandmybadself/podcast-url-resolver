import { Model, Column, Table, Unique, Index, Default } from 'sequelize-typescript';

@Table({
  timestamps: true
})

class Platform extends Model<Platform> {
  @Unique
  @Column
  name!: string;

  @Unique
  @Column
  platformId!: string;

  @Column
  urlTemplateString!: string;

  @Index
  @Default(false)
  @Column
  isDeleted!: boolean;
}
export default Platform;
