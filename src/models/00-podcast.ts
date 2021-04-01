import { Model, Column, Table, HasMany } from 'sequelize-typescript';
// Import Category from './Category';
// import CategoryToPodcast from './category-to-podcast';
import Episode from './00-episode';

@Table({
  timestamps: true,
  paranoid: true
})
class Podcast extends Model<Podcast> {
  @Column
  name!: string;

  @Column
  feedURL: string;

  @Column
  homepageURL: string;

  // @HasMany(() => Category, { through: 'CategoryToPodcast' })
  // categories: Category[];

  @HasMany(() => Episode)
  episodes: Episode[];
}

export default Podcast;
