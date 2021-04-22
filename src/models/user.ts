import {Model, Column, Table, Unique} from 'sequelize-typescript';
import {Optional} from 'sequelize/types';

interface IUser {
	id?: number;
	email: string;
	role: 'user' | 'admin' | 'tester';
	deletedAt?: Date;
}

interface UserCreationAttributes extends Optional<IUser, 'id'> { }

@Table({
	paranoid: true
})
class User extends Model<IUser, UserCreationAttributes> {
	@Unique
	@Column({
		validate: {
			isEmail: true
		}
	})
	email!: string;

	@Column
	role: 'user' | 'admin' | 'tester';
}
export default User;

