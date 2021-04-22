import {Request, Response, Router} from 'express';
import sequelize from '../sequelize';
import {requiresAdmin, requiresAuth} from './user';

const routes = (router: Router) => {
	router.get('/platforms', requiresAuth, async (_request: Request, response: Response) => {
		const result: any = await sequelize.model('Platform').findAll({attributes: ['name', 'platformId']});

		result.push({
			name: 'Google Podcasts',
			id: 'google'
		});

		return response.status(200).json({
			message: 'ok',
			result
		});
	});
};

export default routes;
