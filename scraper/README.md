Scraper
=======

This folder contains the code for the web scraper that fetches questions from the Leben in Deutschland website.

## Running the Scraper

To run the scraper, various dependencies are needed for playwright. It's recommended to run this with the provided dev container so not to spray your system with dependencies.

The scraper can be run with the following commands:

```sh
npm ci
npx playwright install-deps
npx playwright install
npm run scrape
```
