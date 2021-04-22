import {Request, Response, Router} from 'express';
import {lookupEpisodeByFeedURLAndGUID, lookupEpisodeByShareURL} from '../services/lookup';
import {requiresAuth} from './user';

const routes = (router: Router) => {
	router.get('/episode/lookup/url/:url(*)', requiresAuth, async (request: Request, response: Response) => {
		// This is to catch stuff in a query string.  Params doesn't provide that.
		const parameters = request.originalUrl.replace('/v1/episode/lookup/url/', '');
		const episode = await lookupEpisodeByShareURL(parameters);
		response.status(200).send({message: 'ok', episode});
	});

	router.get('/episode/lookup/feed/:feedURL(*)/:guid', requiresAuth, async (request: Request, response: Response) => {
		const {feedURL, guid} = request.params;
		const episode = await lookupEpisodeByFeedURLAndGUID(feedURL, guid);
		response.status(200).send({message: 'ok', episode});
	});
};

export default routes;
