console.log(`🎧 Episodes.fm - ${process.env.ENV}`);

import sequelize from './sequelize';
import {initExpress} from './express';

(async () => {
	try {
		initExpress();
	} catch (error: unknown) {
		console.error(error);
	}
})();
