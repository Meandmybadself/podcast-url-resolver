/* eslint eslint-comments/no-unused-enable: error */

import {Sequelize} from 'sequelize-typescript';
import path from 'path';
import Platform from './models/00-platform';
import PlatformHost from './models/platform-host';

const sequelize = new Sequelize({
	dialect: 'postgres',
	database: process.env.DB_DATABASE,
	host: process.env.DB_HOST,
	username: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	logging: process.env.SILENT !== '1',
	models: [path.resolve(__dirname, 'models')]
});

const initializeBaseTables = async () => {
	console.log('Initializing base tables.');
	await Platform.create({name: 'Overcast', platformId: 'overcast'});
	await Platform.create({name: 'Apple Podcasts', platformId: 'apple'});
	await Platform.create({name: 'Spotify', platformId: 'spotify'});

	await PlatformHost.create({hostname: 'overcast.fm', platformId: 1});
	await PlatformHost.create({hostname: 'podcasts.apple.com', platformId: 2});
	await PlatformHost.create({hostname: 'open.spotify.com', platformId: 3});

	console.log('Done initializing base tables.');
};

(async () => {
	console.info('Connecting to database');
	await sequelize.authenticate();
	console.info('Connected to database.');

	if (process.env.DB_INIT_BASE_TABLES === '1') {
		await sequelize.sync({force: true});
		await initializeBaseTables();
	} else {
		console.log('Altering tables.');
		await sequelize.sync({alter: true});
	}

	if (process.env.PREPUSH_CHECK) {
		console.log('✅ prepush check - Successfully started. Exiting.');
		/* eslint-disable unicorn/no-process-exit */
		process.exit();
		/* eslint-enable unicorn/no-process-exit */
	}
})();

export default sequelize;
