import {Request, Response, Express} from 'express';

const routes = (app: Express) => {
	app.get('/episodes/lookup/:url', (_request: Request, response: Response) => {
		response.status(503).end();
	});
};

export default routes;
