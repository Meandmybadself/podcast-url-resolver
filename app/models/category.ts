import {Model, Column, Table, Unique, Index, Default} from 'sequelize-typescript';

@Table({
	timestamps: true
})
export class Category extends Model<Category> {
	@Column
	@Unique
	string!: string;

	@Column
	@Index
	@Default(false)
	isDeleted!: boolean;
}
