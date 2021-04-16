import {Request, Response, Router} from 'express';
import sequelize from '../sequelize';

const routes = (router: Router) => {
	router.get('/platforms', async (_request: Request, response: Response) => {
		const result: any = await sequelize.model('Platform').findAll({attributes: ['name', 'platformId']});
		return response.status(200).json({
			message: 'ok',
			result
		});
	});
	router.post('/platform', async (request: Request, response: Response) => {
		const {name, platformId} = request.body;
		const result = await sequelize.model('Platform').create({name, platformId});
		return response.status(200).json({
			message: 'ok',
			result
		});
	});
};

export default routes;
