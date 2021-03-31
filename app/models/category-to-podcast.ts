import {Model, Column, Table, Index, Default} from 'sequelize-typescript';
import {DataTypes} from 'sequelize';
import {Category} from './category';
import {Podcast} from './podcast';

@Table({
	timestamps: true
})
export class CategoryToPodcast extends Model<CategoryToPodcast> {
	@Column({
		type: DataTypes.INTEGER,
		references: {
			model: Category,
			key: 'id'
		},
		unique: 'categoryPodcast'
	})
	categoryId!: number;

	@Column({
		type: DataTypes.INTEGER,
		references: {
			model: Podcast,
			key: 'id'
		},
		unique: 'categoryPodcast'
	})
	podcastId!: number;

	@Column
	@Index
	@Default(false)
	isDeleted!: boolean;
}
