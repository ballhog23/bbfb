# Bleed Blue Fantasy Football

A web application for the Bleed Blue fantasy football league that tracks historical and current season data from the [Sleeper API](https://docs.sleeper.app/). View matchups, standings, and league records across every season.

## Motivation
I built this to implement a cost-optimized, 3-tier AWS architecture for real-time data ingestion. The project solves the challenge of maintaining long-term historical data from the Sleeper API by implementing a persistent PostgreSQL-backed synchronization pipeline.

## Features

- **Matchups** — Browse weekly matchups by season with scores, starters, and player-level scoring breakdowns. Toggle between regular season and playoff views.
- **Champions Hall** — Historical league records and championship achievements.
- **Sacko Hall** — Historical last-place finisher records.
- **Rivalry Tracking** — Head-to-head records between any two teams across all seasons.
- **League Stats** — Season-scoped statistics and league-wide analytics.
- **Automated Data Sync** — AWS Step Functions orchestrate Lambda functions to sync league, user, roster, and matchup data from Sleeper on a schedule during the NFL season.
- **Historical Data** — Full league history is stored in a PostgreSQL database, independent of Sleeper API availability.
- **Bootstrap Season** — Seed a full season's worth of data (league, users, rosters, matchups) from the Sleeper API in a single operation, enabling quick setup for new seasons or recovering from data loss.
- **Bootstrap History** — Backfill all historical seasons in one pass, populating the database with complete league history from the very first season through the most recent.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Server | Express, Node.js, TypeScript |
| Views | Pug (server-side rendered) |
| Database | PostgreSQL, Drizzle ORM |
| Validation | Zod |
| Client JS | TypeScript bundled with esbuild |
| Styling | Sass |
| Testing | Vitest, MSW |

## Project Structure

```
src/
├── api/              # API route handlers (sync, bootstrap, pages)
├── db/
│   ├── schema.ts     # Drizzle table definitions
│   ├── queries/      # Query functions by domain
│   └── migrations/   # Auto-generated Drizzle migrations
├── lib/              # Sleeper API client, Zod schemas, helpers
├── middleware/       # Express middleware (error handling)
├── routes/           # Route registration (api/, web/)
├── services/
│   ├── api/          # Business logic for API endpoints
│   └── web/          # Business logic for page rendering
└── web/              # Page handlers

views/                # Pug templates (layouts, pages, partials, mixins)
public-ts/            # Client-side TypeScript source
public/               # Compiled static assets (JS, CSS, images)
infra/                # AWS CDK stack, Lambda handlers, setup scripts
test/                 # Test files
```

## Infrastructure

The app runs on a 3-tier AWS architecture provisioned with **AWS CDK** (TypeScript):

```
Internet
   │
   ▼
┌──────────────────────┐
│  Reverse Proxy (EC2) │  Public subnet — Nginx, Let's Encrypt SSL,
│                      │  rate limiting, security headers
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│  App Server (EC2)    │  Private subnet — Node.js / Express
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│  Database (EC2)      │  Private subnet — PostgreSQL, SSL,
│                      │  inbound restricted to app server only
└──────────────────────┘
```

**Data sync pipeline:**
- An EventBridge rule triggers a Step Functions state machine every 15 minutes
- A gate Lambda checks the NFL season calendar before proceeding
- During the season, Lambdas run in sequence: league &rarr; users &rarr; rosters &rarr; matchups
- A separate daily EventBridge rule syncs player data and league state

**Other infrastructure details:**
- NAT instance (`fck-nat`) instead of NAT Gateway for cost savings
- EC2 Instance Connect Endpoint for secure shell access (no SSH keys)
- GitHub Actions OIDC for credential-free CI/CD deployments
- All instances are ARM-based `t4g.nano` for minimal cost

## Project Goals

- Manage third-party data from the Sleeper API with runtime validation (Zod)
- Design a normalized database schema and maintain historical data integrity across seasons
- Build and operate a production AWS environment with CDK
- Keep costs minimal (~$10-15/month)

## Data Source

Thanks to the [Sleeper API](https://docs.sleeper.app/) for providing free access to fantasy football league data.

## Development

### Prerequisites

- Node.js 24+
- PostgreSQL 17
- npm

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` or create a `.env` file in the project root with the required variables (see `src/config.ts` for the full list).

3. **Set up the database:**
   ```bash
   createdb <APP_NAME>
   npm run migrate
   ```

4. **Run in development mode:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with file watchers |
| `npm run build` | Full build (server + client + styles) |
| `npm run build:server` | Compile server TypeScript |
| `npm run build:client` | Bundle client TypeScript with esbuild |
| `npm run build:scss` | Compile Sass to CSS |
| `npm run build:images` | Optimize static images with Sharp |
| `npm start` | Start the production server |
| `npm run generate` | Generate Drizzle migration files |
| `npm run migrate` | Run database migrations |
| `npm test` | Run tests with Vitest |

## Deployment

Pushes to `master` trigger a GitHub Actions workflow that:

1. Builds and tests the application
2. Authenticates to AWS via OIDC (no stored credentials)
3. Sends an SSM command to the app server to pull, build, migrate, and restart

For initial infrastructure provisioning and setup, see [infra/DEPLOYMENT.md](infra/DEPLOYMENT.md).

For ongoing updates including environment variable / secrets management, see [infra/UPDATES.md](infra/UPDATES.md).