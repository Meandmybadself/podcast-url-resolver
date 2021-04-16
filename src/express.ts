import bodyParser from 'body-parser';
import express, {Request, Response} from 'express';
import errorhandler from 'strong-error-handler';
import path from 'path';

import episodeRoutes from './routes/episode';
import platformRoutes from './routes/platform';
import podcastRoutes from './routes/podcast';
import userRoutes from './routes/user';

export const initExpress = () => {
	const app = express();

	const router = express.Router();

	router.use(bodyParser.json());

	router.get('/', (_request: Request, response: Response) => {
		response.status(200).sendFile(path.join(__dirname, '/templates/index.html'));
	});

	episodeRoutes(router);
	platformRoutes(router);
	podcastRoutes(router);
	userRoutes(router);

	router.use((_request: Request, response: Response) => {
		return response.status(404).json({
			error: 'Not Found'
		});
	});

	router.use(errorhandler({
		debug: process.env.ENV !== 'prod',
		log: true
	}));

	app.use('/v1', router);

	const port: number = Number.parseInt(process.env.PORT, 10) || 8000;
	app.listen(port);
	console.info(`Server started: http://127.0.0.1:${port}`);
};

