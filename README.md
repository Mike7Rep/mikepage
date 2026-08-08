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
