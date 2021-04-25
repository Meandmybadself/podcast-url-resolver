import {Request, Response, Router} from 'express';
import {lookupPodcastByFeedURL} from '../services/lookup';
import {EpisodeRequest, EpisodeResponse} from '../utilities/request-response';
import {requiresAuth} from './user';

const routes = (router: Router) => {
	router.get('/podcast/lookup/feed/:url(*)', requiresAuth, async (request: EpisodeRequest, response: EpisodeResponse) => {
		try {
			const podcasts = await lookupPodcastByFeedURL(request.params.url);
			return response.success({podcasts});
		} catch {
			return response.failure('Unable to lookup feed', 500);
		}
	});
};

export default routes;
