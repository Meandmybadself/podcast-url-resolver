import {Model, Column, Table, Unique, ForeignKey, BelongsTo} from 'sequelize-typescript';
import {Optional} from 'sequelize/types';
import Platform from './00-platform';

interface PlatformHostAttributes {
	id: number;
	hostname: string;
	platformId: number;
}

interface PlatformHostCreationAttributes extends Optional<PlatformHostAttributes, 'id'> { }

@Table({
	timestamps: false,
	paranoid: true
})
class PlatformHost extends Model<PlatformHostAttributes, PlatformHostCreationAttributes> {
	@Unique
	@Column
	hostname!: string;

	@BelongsTo(() => Platform)
	platform: Platform;

	@ForeignKey(() => Platform)
	platformId: number;
}
export default PlatformHost;
