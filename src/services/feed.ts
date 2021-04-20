/* eslint-disable @typescript-eslint/no-floating-promises */

import parsePodcast from 'node-podcast-parser';
import axios from 'axios';
import {IFeed} from '../interfaces/feed';
import {ICanonicalEpisode, ICanonicalPodcast, ICanonicalPodcastWithEpisodes, IFeedEpisode} from '../interfaces';
import CanonicalPodcast from '../models/00-canonical-podcast';
import {makeSearchSafeString} from '../utilities/string';
import Category from '../models/00-category';
import CategoryToPodcast from '../models/category-to-podcast';
import CanonicalEpisode from '../models/00-canonical-episode';

export const loadFeed = async (url: string): Promise<IFeed | void> => new Promise((resolve, reject) => {
	try {
		axios.get(url).then(({data}) => {
			// Console.log('data', data)
			parsePodcast(data, (error: unknown, feed: any) => {
				if (error) {
					reject(error);
					return;
				}

				if (feed) {
					// Don't need the numbers, just the string values.
					feed.categories = Object.values(feed.categories);
					resolve(feed);
					return;
				}

				resolve();
			});
		});
	} catch (error: unknown) {
		reject(error);
	}
});

export const loadAndUpsertFeed = async (feedURL: string): Promise<ICanonicalPodcastWithEpisodes> => {
	const feed: IFeed | void = await loadFeed(feedURL);
	if (feed) {
		const {
			title,
			description: {
				long: description
			},
			link,
			image: artworkURL,
			language,
			copyright,
			updated,
			explicit,
			author,
			type,
			owner: {
				name: ownerName,
				email: ownerEmail
			},
			categories
		} = feed;

		const feedEpisodes: IFeedEpisode[] = feed.episodes;

		try {
			const [canonicalPodcast, wasCreated]: [ICanonicalPodcast, boolean] = await CanonicalPodcast.findOrCreate({
				where: {
					title,
					searchTitle: makeSearchSafeString(title),
					feedURL,
					description,
					artworkURL,
					copyright: copyright || null,
					language,
					author,
					ownerName: ownerName || null,
					ownerEmail,
					explicit,
					link: link || null,
					type: type || null,
					updated: new Date(updated)
				},
				plain: true
			})
				.then(([canonicalPodcast, wasCreated]) => [canonicalPodcast.get({plain: true}), wasCreated]);

			if (!wasCreated) {
				// Associate categories w/ pod.
				// First, we need to make sure that the categories exist.
				const categoriesAsArray: string[] = categories;
				const categoryResults: any[] = [];
				await Promise.all(categoriesAsArray.map(async (label: string) => {
					let [categoryResult] = await Category.findOrCreate({
						where: {
							label
						}
					});
					categoryResult = categoryResult.get({plain: true});
					categoryResults.push(categoryResult);
				}));

				// Associate the categories with the podcast.
				await Promise.all(categoryResults.map(async category => CategoryToPodcast.findOrCreate({
					where: {
						podcastId: canonicalPodcast.id,
						categoryId: category.id
					}
				})));
			}

			// Associate all feed episodes.
			const episodes: ICanonicalEpisode[] = await Promise.all(feedEpisodes.map(async ({description, duration, enclosure, episodeType, guid, image: artworkURL, published: publishDate, title}: IFeedEpisode) =>
				CanonicalEpisode.findOrCreate({
					where: {
						artworkURL: artworkURL || null,
						description,
						duration,
						enclosureURL: enclosure.url,
						episodeType,
						guid,
						canonicalPodcastId: canonicalPodcast.id,
						publishDate,
						searchTitle: makeSearchSafeString(title),
						title
					}
				}).then(([episode, _wasCreated]) => episode.get({plain: true}))
			));

			return {...canonicalPodcast, episodes};
		} catch (error: unknown) {
			console.log('Error while upserting feed.', error);
		}
	}
};
