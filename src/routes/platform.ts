import {Request, Response, Express} from 'express';
import sequelize from '../sequelize';

const routes = (app: Express) => {
	app.get('/platforms', async (_request: Request, response: Response) => {
		const result: any = await sequelize.model('Platform').findAll();
		return response.status(200).json({
			message: 'ok',
			result
		});
	});
	app.post('/platform', async (request: Request, response: Response) => {
		const {name, platformId, urlTemplateString} = request.body;
		const result = await sequelize.model('Platform').create({name, platformId, urlTemplateString});
		return response.status(200).json({
			message: 'ok',
			result
		});
	});
	app.delete('/platform/:id', async (request: Request, response: Response) => {
		const {id} = request.params;
		const result = await sequelize.model('Platform').destroy({
			where: {
				id
			}
		});
		return response.status(200).json({
			message: 'ok',
			result
		});
	});
};

export default routes;
