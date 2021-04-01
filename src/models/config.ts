import {Model, Column, Table, Unique} from 'sequelize-typescript';

@Table({
	timestamps: true,
	paranoid: true
})
class Config extends Model<Config> {
	@Unique
	@Column
	key!: string;

	@Column
	value: string;
}

export default Config;
