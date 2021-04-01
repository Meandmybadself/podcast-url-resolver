import {Model, Column, Table} from 'sequelize-typescript';

@Table({
	timestamps: true,
	paranoid: true
})
class User extends Model<User> {
	@Column({
		validate: {
			isEmail: true
		}
	})
	email!: string;

	@Column
	secret!: string;

	@Column
	role: 'user' | 'admin';
}
export default User;

