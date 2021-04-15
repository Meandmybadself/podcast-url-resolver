if (!process.env.DB_HOST) {
	console.info('Initialzing with local environment variables.');
	require('dotenv').config();
}

import sequelize from './sequelize';
import {initExpress} from './express';

(async () => {
	try {
		initExpress();
	} catch (error: unknown) {
		console.error(error);
	}
})();

