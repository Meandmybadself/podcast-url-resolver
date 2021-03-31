import {Model, Column, Table, Unique, Index, Default} from 'sequelize-typescript';

@Table({
	timestamps: true
})
class Config extends Model<Config> {
	@Unique
	@Column
	key!: string;

	@Column
	value: string;

	@Index
	@Default(false)
	@Column
	isDeleted!: boolean;
}

export default Config;
