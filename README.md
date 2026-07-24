# mikepage

Next.js homepage with the private `myDashboard` area for Depot, Vermögen and Health.

## Local Development

```bash
pnpm install
pnpm dev
```

The Next.js dev server runs directly on the host and reloads changes immediately.
Docker is not required locally. Set the dashboard variables and the public Railway
proxy URLs in `.env.local`:

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
local `.env.local` already contains the public Postgres and Redis endpoints.

> **Warning:** Local development reads and writes production data. Do not run
> `prisma migrate dev`, `prisma migrate reset`, or `pnpm db:seed` against this
> configuration unless changing production data is intentional.

Dashboard sessions are stored in Redis for ten days. Each browser and device gets
its own session and logout only removes the current session.

Health checks:

```bash
curl http://localhost:3000/health
```

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

Prisma owns the Postgres schema. The production Docker start command runs migrations before `next start`.

Useful commands for a dedicated local or staging database:

```bash
pnpm prisma validate
pnpm prisma migrate dev
pnpm db:seed
```

`pnpm db:seed` imports the historical Vermögen snapshots into the configured `DATABASE_URL`.
Do not run these write commands against the production URLs used for local app testing.

## Railway

Deploy the web app as a single Railway service plus Postgres and Redis.

Web service:

```bash
Dockerfile Path: Dockerfile
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

After deploying, seed the production wealth data once from a Railway shell or local Railway environment:

```bash
pnpm db:seed
```

Acceptance checks:

```bash
curl https://www.michael-repolusk.com/health
```

Then log in to `/myDashboard` and verify Vermögen, Health and Depot.
