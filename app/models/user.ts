import {Model, Column, Table, Index, Default} from 'sequelize-typescript';
@Table({
	timestamps: true
})
export class User extends Model<User> {
	@Column
	email!: string;

	@Column
	secret!: string;

	@Column
	role: string;

	@Column
	@Index
	@Default(false)
	isDeleted!: boolean;
}
