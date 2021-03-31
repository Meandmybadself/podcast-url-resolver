import {Model, Column, Table, Index, Default, HasMany} from 'sequelize-typescript';
import {Category} from './Category';
import {Episode} from './Episode';

@Table({
	timestamps: true
})
export class Podcast extends Model<Podcast> {
	@Column
	name!: string;

	@Column
	feedURL: string;

	@Column
	homepageURL: string;

	@HasMany(() => Category)
	categories: Category[];

	@HasMany(() => Episode)
	episodes: Episode[];

	@Column
	@Index
	@Default(false)
	isDeleted!: boolean;
}
