if (process.env.DB_HOST) {
	console.info('Initializing with supplied environment variables.');
} else {
	console.info('Initialzing with local environment variables.');
	require('dotenv').config();
}

console.log(`Episodes.fm starting in ${process.env.ENV} mode.`);

import sequelize from './sequelize';
import {initExpress} from './express';

(async () => {
	try {
		initExpress();
	} catch (error: unknown) {
		console.error(error);
	}
})();
