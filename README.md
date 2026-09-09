# mikepage

Next.js homepage with the private `myDashboard` area for Depot, Vermögen and Health.

## Local Development

```bash
pnpm install
pnpm dev
```

The Next.js dev server runs directly on the host and reloads changes immediately.
The app uses the Railway Postgres and Redis services in development as well as in
production. Set their public proxy URLs in `.env.local`:

```bash
MYDASHBOARD_USER=<user>
MYDASHBOARD_PASSWORD=<password>
MYDASHBOARD_SESSION_SECRET=<long random secret>
REDIS_URL=redis://<user>:<password>@<public-railway-host>:<port>
DATABASE_URL=postgresql://<user>:<password>@<public-railway-host>:<port>/<database>
DIRECT_URL=postgresql://<user>:<password>@<public-railway-host>:<port>/<database>
ALPACA_ENDPOINT=https://api.alpaca.markets
ALPACA_DATA_ENDPOINT=https://data.alpaca.markets
ALPACA_KEY=<alpaca key>
ALPACA_SECRET=<alpaca secret>
WITHINGS_CLIENT_ID=<withings client id>
WITHINGS_CLIENT_SECRET=<withings client secret>
WITHINGS_REDIRECT_URI=http://localhost:3000/myDashboard/withings/callback
```

Use Railway's public proxy URLs (`*.proxy.rlwy.net`) locally. Internal
`*.railway.internal` addresses only work between Railway services. The current
local `.env.local` already contains the public Postgres and Redis endpoints. No
local database, Redis process or container setup is required.

> **Warning:** Local development reads and writes production data. Do not run
> `prisma migrate dev`, `prisma migrate reset`, or `pnpm db:seed` against this
> configuration unless changing production data is intentional.

Dashboard sessions are stored in Redis for ten days. Each browser and device gets
its own session and logout only removes the current session.

Health checks:

```bash
curl http://localhost:3000/health
```

## Google Health

Enable the Google Health API in the Google Cloud project and add the dashboard
user to the OAuth consent screen while the app is in testing. Register these
redirect URIs exactly:

```text
http://localhost:3000/myDashboard/google-health/callback
https://www.michael-repolusk.com/myDashboard/google-health/callback
```

Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_KEY` and the matching
`GOOGLE_HEALTH_REDIRECT_URI`. The dashboard requests read access to activity,
nutrition and sleep data. After changing these scopes, reconnect Google Health
once from `/myDashboard/health`; an old refresh token cannot grant the new
nutrition permission. Google OAuth refresh tokens for an external app in
`Testing` expire after seven days, so move the consent screen to production for
a durable connection.

For the production OAuth consent screen use these public URLs:

```text
Application home page: https://www.michael-repolusk.com/myDashboard
Privacy policy: https://www.michael-repolusk.com/datenschutz
Terms of service: https://www.michael-repolusk.com/nutzungsbedingung
```

The app requests only these Google Health read scopes:

```text
https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly
https://www.googleapis.com/auth/googlehealth.nutrition.readonly
https://www.googleapis.com/auth/googlehealth.sleep.readonly
```

Do not declare `googlehealth.health_metrics_and_measurements.readonly` unless a
current feature actually reads those measurements. Google requires the narrowest
possible scope set. Verify ownership of `michael-repolusk.com`, publish the OAuth
app and submit the restricted scopes for verification if Google requests it.

## Withings

Create a Public API application in the Withings Developer Dashboard and register
these exact callback URLs in the `Callback Url` field, separated by a comma:

```text
http://localhost:3000/myDashboard/withings/callback,https://www.michael-repolusk.com/myDashboard/withings/callback
```

Set `WITHINGS_CLIENT_ID`, `WITHINGS_CLIENT_SECRET` and, in production,
`WITHINGS_REDIRECT_URI=https://www.michael-repolusk.com/myDashboard/withings/callback`.
Then open `/myDashboard/health` and select **Verbinden** in the Withings card.
The first connection imports all available weight and body-fat measurements;
later page visits fetch only changes and store them idempotently in Postgres.

## Database

### Depot and AI Trader

On `/myDashboard/depot`, **Daten aktualisieren** imports Alpaca's daily account
history and account activities for the last six calendar months. **AI Trader
starten** performs the same sync and then reviews each held US equity in sequence.
Symbols reviewed previously but no longer held receive a retrospective review.
There is no scheduled job: a page visit only reads saved history and current
account data. Running the workflow again fills in missing daily equity history.

The progress bar reflects completed server steps. Each review is saved before the
next begins. **Fortsetzen** continues an interrupted workflow; an in-flight step
can be reclaimed after five minutes if the server stopped responding. Leaving the
page or pausing stops subsequent steps, while the current server action may finish.
One failed stock review does not discard other results or the saved portfolio.

Configure these variables on the Railway web service:

```dotenv
OPENAI_API_KEY=<OpenAI API key>
OPENAI_MODEL=<model supporting Responses, web_search and Structured Outputs>
ALPACA_ALLOW_LIVE_TRADING=false
```

Reviews use the OpenAI Responses API with web research and a strict JSON schema.
The request sends the relevant position, portfolio weights, available cash,
adjusted IEX daily bars, and the previous recommendation and price comparison.
Broker credentials and account identifiers are never sent to OpenAI. Sources,
the input data, model, output and usage are saved locally, with `store: false` on
the OpenAI request. API usage is billed separately by the provider.
This is decision memory with feedback, not reinforcement model training.

The chart has two views:

- **Gesamtdepot**: Alpaca equity including cash; comparison capital begins at the
  first available equity value and adds subsequent external cash deposits and
  withdrawals. It is not lifetime cost basis or a time-weighted return. Security
  transfers and unclassified journals suppress this comparison.
- **Aktien & Einkauf**: market value and broker cost basis captured together at
  each manual sync. Historical holdings/cost basis cannot be inferred from equity
  history, so missing points remain null. No today's basis is copied into the past.

Daily equity uses New York trading dates. Today's point is a current observation;
past equity points are reconciled from Alpaca on the next sync. Portfolio cash and
positions share the observation time; saved stock values are not falsely labelled
as historical closing values. FILL activities (including partial fills and sold
positions) alone produce buy/sell markers. Recommendations and open orders do not.

Each successful sync removes this account's snapshots, activities and AI review
runs older than six months, as well as old cached price bars. Reads also filter
by this window. Inactive periods do not run a cleanup job. Unresolved orders are
retained until their status is reconciled; terminal order records have the same
six-month retention. Existing wealth/health and legacy strategy data are untouched.

**Kaufen/Verkaufen** opens a manual, two-step market-order dialog for existing US
equity positions. A two-minute preview checks the current account, asset,
available cash and available quantity. Submitting checks them again. Orders use
`type=market`, `time_in_force=day`, no extended hours, and only submit while the
regular market is open. Market execution prices are not guaranteed by a preview.
Cash availability excludes margin purchasing power and reserves pending buys;
an open market buy with unknown notional conservatively blocks another buy.
Live orders additionally require `ALPACA_ALLOW_LIVE_TRADING=true` on the server.
Paper and live accounts are labelled explicitly and stored separately.

Each submitted order has a persistent unique `client_order_id`. An ambiguous
network response is reconciled using that ID, never blindly submitted again.
Use **Status aktualisieren** to reconcile orders, and **Daten aktualisieren**
after fills to update the chart. Open/unresolved dashboard orders block additional
submissions until reconciled. The AI never calls the order endpoint itself.

Deploy the additive migration `20260909120000_depot_trader` with the existing
Railway pre-deploy migration command. Do not run it against production merely to
test locally. `pnpm test` runs pure calculation tests; integration tests require
an explicitly isolated local database named `depot_test` with migrations applied:

```bash
DEPOT_TEST_DATABASE_URL=postgresql://<local-test-credentials>@127.0.0.1:<port>/depot_test pnpm test
```

Integration tests mock every Alpaca and OpenAI request and refuse any other
network destination. They do not submit real broker orders or incur AI charges.

Prisma owns the Postgres schema. Railway runs pending migrations as a pre-deploy
command before starting the new application version.

Useful read-only checks:

```bash
pnpm prisma validate
pnpm prisma migrate status
```

`pnpm db:seed` imports historical Vermögen snapshots into the configured
`DATABASE_URL`. Since local development points to Railway, do not run seeds,
resets or development migrations unless changing production data is intentional.

## Railway

Deploy the web app as a single Railway service plus Postgres and Redis. The
repository's `railway.json` selects Railpack, builds Next.js, runs Prisma
migrations before deployment and starts the app without a custom image.

Web service:

```bash
DATABASE_URL=<Railway Postgres internal DATABASE_URL>
REDIS_URL=${{Redis.REDIS_URL}}
ALPACA_ENDPOINT=https://api.alpaca.markets
ALPACA_DATA_ENDPOINT=https://data.alpaca.markets
ALPACA_KEY=<alpaca key>
ALPACA_SECRET=<alpaca secret>
WITHINGS_CLIENT_ID=<withings client id>
WITHINGS_CLIENT_SECRET=<withings client secret>
WITHINGS_REDIRECT_URI=https://www.michael-repolusk.com/myDashboard/withings/callback
```

`REDIS_URL` must be configured on the web service as a Railway variable reference
to the Redis service. Defining it only on the Redis service does not expose it to
the web application.

For local development use the public `*.proxy.rlwy.net` URLs. Inside Railway,
keep using the private service URLs supplied by the Postgres and Redis services.

After deploying, seed the production wealth data once from a Railway shell or local Railway environment:

```bash
pnpm db:seed
```

Acceptance checks:

```bash
curl https://www.michael-repolusk.com/health
```

Then log in to `/myDashboard` and verify Vermögen, Health and Depot.
