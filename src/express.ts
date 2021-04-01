import bodyParser from 'body-parser';
import express, {Request, Response} from 'express';
import errorhandler from 'strong-error-handler';

import episodeRoutes from './routes/episodes';
import platformRoutes from './routes/platform';
import userRoutes from './routes/user';

export const app = express();

app.use(bodyParser.json());

app.get('/', (_request: Request, response: Response) => {
	return response.status(200).json({
		message: 'Episodes.fm'
	});
});

episodeRoutes(app);
platformRoutes(app);
userRoutes(app);

app.use((_request: Request, response: Response) => {
	return response.status(404).json({
		error: 'Not Found'
	});
});

app.use(errorhandler({
	debug: process.env.ENV !== 'prod',
	log: true
}));

