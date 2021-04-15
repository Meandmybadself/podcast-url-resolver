import {Model, Column, Table, Unique} from 'sequelize-typescript';

@Table({
	paranoid: true,
	timestamps: false
})
class Config extends Model<Config> {
	@Unique
	@Column
	key!: string;

	@Column
	value: string;
}

export default Config;
