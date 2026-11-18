# Coy Discover

A standalone, mobile-first React app for meeting one profile at a time. A right swipe or **Like** records interest. A left swipe or **Pass** removes the card. Both decisions are final. The Matches view contains only people who also liked you.

## Run locally

Use Node.js 22.11 or newer and npm. From the repository root:

```sh
npm ci
npm run build
npm start
```

Open http://127.0.0.1:3000. Express serves both the Vite production build and the API. Node’s built-in SQLite module may print an experimental-feature notice on Node 22. The demo starts on Discover. Home is intentionally blank.

## Try the demo

1. Like Maya on a fresh deck. The match dialog appears. Choose **View matches** to see her profile.
2. Return to People. Like Theo to see a one-sided like advance the deck without a match dialog.
3. Drag the next card to the left, then reload. The next profile appears and Maya remains in Matches.
4. Finish the deck to see the empty state. Home and Discover remain accessible.

The 32 fictional adult profiles and inbound likes are server-side fixtures. People shown in sample photographs have no association with the fictional bios or likes. Photos are bundled locally so opening the app sends no browsing activity to a photo provider. Photo fixtures come from [Random User](https://randomuser.me/photos) and [Unsplash](https://images.unsplash.com/photo-1524504388940-b1c1722653e1).

## Storage and privacy

The assignment assumes one logged-in demo user. All clients of one running instance share that identity. Run on loopback for individual evaluation. Production use would require authenticated per-user isolation. Set `PORT` to change the listener port and `DB_PATH` to select a different database. The default is `data/coy.sqlite`. To try a fresh deck without disturbing existing swipes, start with a new database path.

Each profile ID has one immutable decision. A single SQLite insert records both the swipe and its mutual-match outcome, so interruption cannot leave a half-created match. A uniqueness constraint resolves concurrent retries. Feed ordering is fixed independently of incoming likes. Only the build directory is served as static content. Neither the database nor the seed module is shipped to the browser. The public repository contains synthetic test fixtures, including the demo match.

## HTTP API

| Route | Success | Behavior |
| --- | --- | --- |
| GET /feed | 200, profile array | Remaining cards in seed order. Empty deck returns an empty array. |
| POST /swipe | 201, `{"createdMatch":true}` or `{"createdMatch":false}` | Accepts JSON such as `{"profileId":"p1","decision":"like"}`. A pass always returns false. |
| GET /matches | 200, profile array | Persisted mutual matches, newest first. |

Profiles contain only `id`, `name`, `age`, `photo`, `bio`, `city`, and `interests`. An identical replay returns 200 with `createdMatch: false` because the replay created nothing. An opposite decision returns 409. Invalid decisions or malformed JSON return 400. An unknown ID returns 404. API responses have `Cache-Control: no-store`.

## Tests

```sh
npm test
npx playwright install chromium
npm run test:e2e
```

You may set `CHROME_PATH` to a locally installed Chrome executable. Browser tests start their own server on port 4179 and use a temporary SQLite database. The API tests use memory or temporary files. Neither suite modifies the demo database.

The API tests cover public response fields, unilateral likes, passes on admirers, mutual matches, duplicates, conflicts, invalid requests, exhaustion and database reopening. The browser test covers Home, the first match, match navigation, persistence after reload, mobile-width dragging, button controls and the empty state.

## Project layout

- `src/` contains the React views, gestures and styles.
- `server.mjs` implements Express routes and SQLite persistence.
- `seed.mjs` holds the fictional profiles and inbound-like fixtures.
- `tests/` and `e2e/` contain API and browser acceptance tests.
- [Product review](PRODUCT.md) covers the supplied Coy UI and two proposed features.
