import {Sequelize} from 'sequelize-typescript';

const sequelize = new Sequelize({
	dialect: 'postgres',
	database: 'episodes',
	host: 'localhost',
	username: 'episodes',
	password: 'd0n7Lie!',
	models: [__dirname + '/models']
});

export default sequelize;
