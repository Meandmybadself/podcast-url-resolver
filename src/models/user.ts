import {Model, Column, Table, Index, Default} from 'sequelize-typescript';
@Table({
	timestamps: true
})
class User extends Model<User> {
	@Column
	email!: string;

	@Column
	secret!: string;

	@Column
	role: string;

	@Index
	@Default(false)
	@Column
	isDeleted!: boolean;
}
export default User;
