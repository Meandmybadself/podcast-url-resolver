console.log(`🎧 Episodes.fm - ${process.env.ENV}`);

import sequelize from './sequelize';
import {initExpress} from './express';

import jwt from 'jsonwebtoken';
import User from './models/user';

(async () => {
	try {
		initExpress();

		if (process.env.LOG_USERS === '1') {
			// Log user JWTs
			(await User.findAll())
				.map(user => user.get({plain: true}))
				.forEach(user => {
					const payload = {
						userId: user.id,
						role: user.role
					};
					const secret = jwt.sign(payload, process.env.JWT_SECRET, {
						algorithm: 'HS256'
					});

					console.log(user.email, secret);
				});
		}
	} catch (error: unknown) {
		console.error(error);
	}
})();
