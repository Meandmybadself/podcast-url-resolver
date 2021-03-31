import {Model, Column, Table, Unique, Index, Default} from 'sequelize-typescript';

@Table({
	timestamps: true
})

export class Platform extends Model<Platform> {
	@Column
	@Unique
	name!: string;

	@Column
	@Unique
	id!: string;

	@Column
	urlTemplateString!: string;

	@Column
	@Index
	@Default(false)
	isDeleted!: boolean;
}
