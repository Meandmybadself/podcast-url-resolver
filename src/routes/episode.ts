import {Request, Response, Router} from 'express';
import {lookupEpisodeByFeedURLAndGUID, lookupEpisodeByShareURL} from '../services/lookup';

const routes = (router: Router) => {
	router.get('/episode/lookup/url/:url(*)', async (request: Request, response: Response) => {
		const episode = await lookupEpisodeByShareURL(request.params.url);
		response.status(200).send({message: 'ok', episode});
	});

	router.get('/episode/lookup/feed/:feedURL(*)/:guid', async (request: Request, response: Response) => {
		const {feedURL, guid} = request.params;
		const episode = await lookupEpisodeByFeedURLAndGUID(feedURL, guid);
		response.status(200).send({message: 'ok', episode});
	});
};

export default routes;
