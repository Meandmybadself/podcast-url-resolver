import {Model, Column, Table, Index, Default} from 'sequelize-typescript';
import {DataTypes} from 'sequelize';
import Category from './00-category';
import Podcast from './00-podcast';

@Table({
	timestamps: true
})
class CategoryToPodcast extends Model<CategoryToPodcast> {
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

	@Index
	@Default(false)
	@Column
	isDeleted!: boolean;
}

export default CategoryToPodcast;
