import {Model, Column, Table} from 'sequelize-typescript';
import {DataTypes} from 'sequelize';
import Category from './00-category';
import CanonicalPodcast from './00-canonical-podcast';

@Table({
	paranoid: true,
	timestamps: false
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
			model: CanonicalPodcast,
			key: 'id'
		},
		unique: 'categoryPodcast'
	})
	podcastId!: number;
}

export default CategoryToPodcast;
