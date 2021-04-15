import {Model, Column, Table, Unique, Index, Default, HasMany} from 'sequelize-typescript';
import {Optional} from 'sequelize/types';
import PlatformHost from './platform-host';
import {IPlatform} from '../interfaces';

interface PlatformCreationAttributes extends Optional<IPlatform, 'id'> { }

@Table({
	timestamps: false,
	paranoid: true
})
class Platform extends Model<IPlatform, PlatformCreationAttributes> {
	@Unique
	@Column
	name!: string;

	@Unique
	@Column
	platformId!: string;

	@HasMany(() => PlatformHost)
	platformHosts: PlatformHost[];

	@Index
	@Default(true)
	@Column
	isActive!: boolean;
}
export default Platform;
