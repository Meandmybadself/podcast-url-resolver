import {Model, Column, Table, Unique, Index, Default} from 'sequelize-typescript';

@Table({
	timestamps: true
})
class Category extends Model<Category> {
	@Unique
	@Column
	label!: string;

	@Index
	@Default(false)
	@Column
	isDeleted!: boolean;
}

export default Category;
