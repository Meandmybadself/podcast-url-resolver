import {Model, Column, Table, Unique} from 'sequelize-typescript';

@Table({
	paranoid: true
})
class Category extends Model<Category> {
	@Unique
	@Column
	label!: string;
}

export default Category;
