# Episodes.fm API service

## URLs

## Development

### Assumptions
* [nvm](https://github.com/nvm-sh/nvm) installed to version node.
* Code editor honors `.editorconfig` configuration

### Installation

```
  nvm use && 
  npm i --silent
```

## Docs

* [Template documentation](./docs/TEMPLATE.md)


## Development notes

* Models need to be instantiated, dependencies-first.  That's why the files are named the way they are.

## Key Decisions

* We went with a JSON response instead of GQL because we believe that it will primarily be server-side services consuming this API.
* Not storing Google Podcasts explicitly, as they can be derived from canonical feed information.
