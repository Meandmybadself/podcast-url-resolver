import sequelize from './sequelize';
import {app} from './express';
import serverless from 'serverless-http';

(async () => {
	console.info('Initializing database.');
	await sequelize.sync({alter: true});
	try {
		await sequelize.authenticate();
	} catch (error) {
		console.error(error);
	}
});

export const handler = serverless(app);
