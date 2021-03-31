import bodyParser from 'body-parser';
import express, {Request, Response} from 'express';
import errorhandler from 'strong-error-handler';
import sequelize from './sequelize';

export const app = express();

app.use(bodyParser.json());

const notImplemented = async (_request: Request, response: Response) => response.status(501).json({message: 'Not implemented'});

app.get('/', (_request: Request, response: Response) => {
	return response.status(200).json({
		message: 'Episodes.fm'
	});
});
app.get('/platforms', async (_request: Request, response: Response) => {
	const result: any = await sequelize.model('Platform').findAll();
	return response.status(200).json({
		message: 'ok',
		result
	});
});
app.post('/platforms', notImplemented);
app.delete('/platforms', notImplemented);

app.get('/episodes/lookup/:url', notImplemented);

app.get('/users', notImplemented);
app.post('/users', notImplemented);
app.delete('/users/:id', notImplemented);

app.use((_request: Request, response: Response) => {
	return response.status(404).json({
		error: 'Not Found'
	});
});

app.use(errorhandler({
	debug: process.env.ENV !== 'prod',
	log: true
}));

