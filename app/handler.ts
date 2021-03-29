import serverless from 'serverless-http';
import express, {Request, Response} from 'express';

const app = express();

app.get('/', (_request: Request, response: Response) => {
	return response.status(200).json({
		message: 'Episodes.fm -  root handler'
	});
});

app.use((_request: Request, response: Response) => {
	return response.status(404).json({
		error: 'Not Found'
	});
});
export const handler = serverless(app);
