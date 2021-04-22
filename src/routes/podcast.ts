import {Request, Response, Router} from 'express';
import {lookupPodcastByFeedURL} from '../services/lookup';
import {requiresAuth} from './user';

const routes = (router: Router) => {
	router.get('/podcast/lookup/feed/:url(*)', requiresAuth, async (request: Request, response: Response) => {
		const episode = await lookupPodcastByFeedURL(request.params.url);
		response.status(200).send({message: 'ok', episode});
	});
};

export default routes;
