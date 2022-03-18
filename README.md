# Episodes.fm API service

## URLs

## Development

### Assumptions

- [nvm](https://github.com/nvm-sh/nvm) installed to version node.
- Code editor honors `.editorconfig` configuration

### Installation

```
  nvm use &&
  npm i --silent
```

## Environment Variables

| _Key_                 | _Description_                                                      |
| --------------------- | ------------------------------------------------------------------ |
| ENV                   | "prod"                                                             |
| SENTRY_URI            | URI to Sentry instance                                             |
| LOG_USERS             | Logs out users to stdout                                           |
| PORT                  | Service listen port                                                |
| JWT_SECRET            | Secret used when generating auth JWT                               |
| DB_DATABASE           | Database name                                                      |
| DB_HOST               | Database host                                                      |
| DB_USERNAME           | Database username                                                  |
| DB_PASSWORD           | Database password                                                  |
| DB_INIT_BASE_TABLES   | Initializes base tables                                            |
| SILENT                | Mutes DB logging                                                   |
| PREPUSH_CHECK         | Used when pushing. Attempts to start instance before allowing push |
| OVERCAST_EMAIL        | Overcast email                                                     |
| OVERCAST_PASSWORD     | Overcast password                                                  |
| PODCASTINDEX_KEY      | Podcastindex API key                                               |
| PODCASTINDEX_SECRET   | Podcastindex secret                                                |
| SPOTIFY_CLIENT_ID     | Spotify API client ID                                              |
| SPOTIFY_SECRET        | Spotify secret                                                     |
| TEST_USER_DAILY_LIMIT | Daily limit for API interactions for test user                     |

## Development notes

- Models need to be instantiated, dependencies-first. That's why the files are named the way they are.

## Key Decisions

- We went with a JSON response instead of GQL because we believe that it will primarily be server-side services consuming this API.
- Not storing Google Podcasts explicitly, as they can be derived from canonical feed information.
- Not allowing creation of platforms via API because they will most likely have code dependencies that cannot be satistied.

## Lookup Flow

If we can get a handle on the canonical podcast / episode, we can then search for these on other sites.

### Get Share URLs with Share URL

`GET /episode/lookup/url`
`lookup.lookupEpisodeByShareURL`

- Normalizes URL (stripping off UTM-type crap)
- Check to see if we've already looked this episode up `getEpisodeByShareURL`. Return if so.
- Check to see if we support looking up episodes for this podcast using the hostname (`PlatformHost` table)
- Request the active clients list `getActivePlatformClients`
- Check to see if a PlatformHost exists & is an active platform client.

_Try to find a canonical podcast associated with the episode_

- Get search criteria `ISearchCriteria` (for use in searching on other platforms) by loading & scraping the provided URL (in most cases).
- Sometimes, the search criteria contains the podcast's canonical feed url.
  - If so, use the feedURL (which is a property on `CanonicalPodcast`) to try & load a saved `CanonicalPodcast`.
  - If not, try to look it up by its title.
- If we still don't have a `CanonicalPodcast`, try to search for it on Podcast Index using the title.
- Go through the results from Podcast Index & look for an exact title match (after normalizing titles)
- When we find a title match, we have a canonical feed url. Use that to load & upsert the feed. `loadAndUpsertFeed`
- We now have a `CanonicalPodcast` & its episodes.
- If an iTunes id was available from the Podcast Index lookup, we should create a podcast with it so we don't have to look it up later.

_Try to find a canonical episode associated with the canonical podcast_

- Thing is – if we have the canonical podcast, we _probably_ have the canonical episode (because the podcast lists its episodes)
- See if we already have it in the database.
- If not, load the feed using the `CanonicalPodcast` feedURL.
- Find the `CanonicalEpisode` in the feed & add to database.

_Add the third-party podcasts_

- Request the active clients list `getActivePlatformClients`
- Have each ensure we have the episode in the database.
- Associate the share URL w/ the `PlatformEpisodeURL` in the database.

_Request all the data we've just added_

- Get the `ICanonicalEpisode` from the database & return.

### Get Share URLs with Feed URL & GUID

`GET /episode/lookup/feed`

`lookup.lookupEpisodeByFeedURLAndGUID`

- Fetches feed using the feed URL (or uses previously stored feed) `lookup.loadAndUpsertFeed`
- Looks through the feed for the episode with the provided GUID
- If an episode match is found, we now have a canonical podcast & episode
- Request the active clients list `getActivePlatformClients`
- For each active client, attempt to insert the podcast episode. `client.ensurePodcastEpisode`
- Re-lookup the episodes up for all clients. `getThirdPartyPlatformEpisodeURLs`
- Respond with the thirdPartyURLs.

### Potential issues?

- Looking up CanonicalPodcast by title in share URL lookup could result in problems with same-named podcasts.
- Canonical Podcast lookup isn't working when adding a canonical podcast.

### Open Questions

- Does Podcast Index have better title search yet?
