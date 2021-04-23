import {Request, Response, Router} from 'express';
import {lookupPodcastByFeedURL} from '../services/lookup';
import {requiresAuth} from './user';

const routes = (router: Router) => {
	router.get('/podcast/lookup/feed/:url(*)', requiresAuth, async (request: Request, response: Response) => {
		try {
			const episode = await lookupPodcastByFeedURL(request.params.url);
			response.status(200).send({message: 'ok', episode});
		} catch {
			response.status(500).send({message: 'error', details: 'Unable to lookup feed.'});
		}
	});
};

export default routes;
