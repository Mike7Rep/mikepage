# mikepage

Next.js homepage with the private `myDashboard` area for Depot, Vermögen and Health.

## Local Development

```bash
pnpm install
pnpm dev
```

Set the dashboard and data variables in `.env.local`:

```bash
MYDASHBOARD_USER=<user>
MYDASHBOARD_PASSWORD=<password>
MYDASHBOARD_SESSION_SECRET=<long random secret>
DATABASE_URL=postgresql://mikepage:mikepage@localhost:5432/mikepage
ALPACA_ENDPOINT=https://api.alpaca.markets
ALPACA_DATA_ENDPOINT=https://data.alpaca.markets
ALPACA_KEY=<alpaca key>
ALPACA_SECRET=<alpaca secret>
OPENAI_API_KEY=<openai key>
OPENAI_MODEL=gpt-5.5
AI_WATCHLIST=NVDA,TSM,PLTR
INTERNAL_JOB_TOKEN=<shared job secret>
```

Health checks:

```bash
curl http://localhost:3102/health
```

## Database

Prisma owns the Postgres schema. The production Docker start command runs migrations before `next start`.

Useful commands:

```bash
pnpm prisma validate
pnpm prisma migrate dev
pnpm db:seed
```

`pnpm db:seed` imports the historical Vermögen snapshots into the configured `DATABASE_URL`.

## Railway

Deploy the web app as a single Railway service plus Postgres.

Web service:

```bash
Dockerfile Path: Dockerfile
DATABASE_URL=<Railway Postgres internal DATABASE_URL>
ALPACA_ENDPOINT=https://api.alpaca.markets
ALPACA_DATA_ENDPOINT=https://data.alpaca.markets
ALPACA_KEY=<alpaca key>
ALPACA_SECRET=<alpaca secret>
OPENAI_API_KEY=<openai key>
OPENAI_MODEL=gpt-5.5
AI_WATCHLIST=<comma separated symbols>
INTERNAL_JOB_TOKEN=<shared job secret>
```

Trigger the weekly AI review through the web service:

```bash
curl -X POST https://www.michael-repolusk.com/api/jobs/evaluate-weekly \
  -H "X-Internal-Token: <shared job secret>" \
  -H "Content-Type: application/json" \
  -d '{"execute":true,"force":false}'
```

After deploying, seed the production wealth data once from a Railway shell or local Railway environment:

```bash
pnpm db:seed
```

Acceptance checks:

```bash
curl https://www.michael-repolusk.com/health
```

Then log in to `/myDashboard`, open `/myDashboard/depot`, and verify the page no longer needs `PYTHON_API_URL`.
