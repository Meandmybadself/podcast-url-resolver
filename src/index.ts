if (!process.env.DB_HOST) {
	console.info('Initialzing with local environment variables.');
	require('dotenv').config();
}

import sequelize from './sequelize';
import {app} from './express';

(async () => {
	await sequelize.sync({alter: true});
	console.info('DB synched.');
	try {
		await sequelize.authenticate();
		const port: number = Number.parseInt(process.env.PORT, 10) || 8000;
		app.listen(port);
		console.info(`Server started: http://127.0.0.1:${port}`);
	} catch (error: unknown) {
		console.error(error);
	}
})();

