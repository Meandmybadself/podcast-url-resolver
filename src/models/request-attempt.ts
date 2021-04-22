import moment from 'moment';
import {AfterCreate, BelongsTo, Column, Default, ForeignKey, Model, Table} from 'sequelize-typescript';
import {Optional} from 'sequelize/types';
import User from './user';

interface IRequestAttempt {
	id?: number;
	userId: number;
	day?: string;
	count?: number;
	createdAt?: Date;
	deletedAt?: Date;
}

interface RequestCreationAttributes extends Optional<IRequestAttempt, 'id'> { }

@Table
class RequestAttempt extends Model<IRequestAttempt, RequestCreationAttributes> {
	@BelongsTo(() => User)
	user: User;

	@ForeignKey(() => User)
	userId: number;

	@Default(() => moment().format('YYYYMMDD'))
	@Column
	day: string;

	@Default(1)
	@Column
	count: number;

	@AfterCreate
	static async cleanup(): Promise<void> {
		// Nuke any request older than 1 day old.
		await RequestAttempt.destroy({
			where: {
				createdAt: {
					$lte: moment().subtract(1, 'days').toDate()
				}
			}
		});
	}
}

export default RequestAttempt;
