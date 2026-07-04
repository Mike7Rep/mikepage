# mikepage

Next.js homepage with the private `myDashboard` area for Depot and Vermögen.

## Local Development

```bash
pnpm install
pnpm dev
```

Set the web app URL in `.env.local`:

```bash
PYTHON_API_URL=http://127.0.0.1:8000
PYTHON_API_TOKEN=<shared secret>
```

Start the Python API in a second terminal. The API needs the same `DATABASE_URL`
and `PYTHON_API_TOKEN`, plus Alpaca/OpenAI variables when AI reviews should run:

```bash
cd /Users/mikerepolusk/Coding/mikepage
DATABASE_URL=postgresql://mikepage:mikepage@localhost:5432/mikepage \
PYTHON_API_TOKEN=<shared secret> \
hypercorn api.main:app --bind 0.0.0.0:8000
```

Health checks:

```bash
curl http://localhost:3102/health
curl http://127.0.0.1:8000/health
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

Deploy the web app and the Python API as separate Railway services in the same project environment.

Web service:

```bash
Dockerfile Path: Dockerfile
DATABASE_URL=<Railway Postgres internal DATABASE_URL>
PYTHON_API_TOKEN=<same secret as API service>
PYTHON_API_URL=http://pythonapi.railway.internal:8080
```

Python API service:

```bash
Dockerfile Path: api/Dockerfile
DATABASE_URL=<same Railway Postgres internal DATABASE_URL>
PYTHON_API_TOKEN=<same secret as web service>
ALPACA_ENDPOINT=https://api.alpaca.markets
ALPACA_DATA_ENDPOINT=https://data.alpaca.markets
ALPACA_KEY=<alpaca key>
ALPACA_SECRET=<alpaca secret>
```

Railway injects the runtime `PORT`; in the current production service it is `8080`, so the private URL uses `:8080`. If the API service log shows another port in `hypercorn ... --bind`, use that port in `PYTHON_API_URL`.

If the `pythonapi` service logs show `next start`, that service is running the root `Dockerfile` and is not the Python API yet. Change its Railway Dockerfile Path to `api/Dockerfile` and redeploy. Correct API logs should show `hypercorn api.main:app`.

If the Python service is not named `pythonapi`, either set `PYTHON_API_URL` to the correct private hostname or set `PYTHON_API_RAILWAY_SERVICE=<service-name>` and omit `PYTHON_API_URL`.

After deploying, seed the production wealth data once from a Railway shell or local Railway environment:

```bash
pnpm db:seed
```

Acceptance checks:

```bash
curl https://www.michael-repolusk.com/health
```

Then log in to `/myDashboard`, open `/myDashboard/depot`, and verify the page no longer shows `Python API Fehler 404`.
