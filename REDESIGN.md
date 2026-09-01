# bbfb Infrastructure Redesign — Serverless + Static Edge

> Design document for migrating bbfb from a 3-tier EC2 architecture to a static
> edge frontend backed by a serverless data pipeline. Status: **proposed**.

## Context

**Why:** The bbfb AWS account runs ~$32/mo, driven almost entirely by **4 always-on
`t4g.nano` EC2 instances + 2 public IPv4 addresses + a NAT instance**. The README's
original target was ~$10–15/mo. The current 3-tier design — `ReverseProxy` (nginx,
public) → `App` (Express + server-side-rendered Pug, private) → `DbInstance`
(self-managed Postgres, private), plus a `fck-nat` instance — carries both cost *and*
security burden: a self-patched internet-facing nginx box, a self-managed Postgres, and
EBS volumes whose encryption-at-rest is unset in CDK.

**Goal:** Re-architect to a **static edge frontend + serverless backend** that deletes
the reverse proxy, app server, NAT, and all public IPv4, while preserving the existing
Sleeper data-sync pipeline's behavior. Optimize for **cost** (~$15/mo, roughly half) and
**security** (no public compute, managed TLS, managed DB, least-privilege).

**Decisions locked in:**
- Frontend → **Astro (MPA) + React islands** for interactivity (filtering). Not a SPA.
- Database → **Amazon RDS Postgres** — justified because it lets us delete
  NAT / proxy / app server / public subnets.
- Edge security → **No WAF** (CloudFront + Shield Standard only).

**Out of scope:** the `calebpirkle-host` / `RuntimeStack` EC2 (personal, not bbfb) and the
`calebpirkle.com` domain renewal that caused June's bill bump.

---

## Approach

Six principles drive the design:

1. **Separate "code/deploy" from "data/refresh."** The site is rebuilt only when *code*
   changes (CI). The *data* is republished by a Lambda every sync (~15 min in-season).
   These are independent pipelines, so a data update never triggers a site rebuild and a
   deploy never waits on data. This is the single most important idea — it's what makes a
   static site viable for content that changes every 15 minutes.

2. **Static-first, hydrate the islands.** Astro ships HTML + CSS with zero JS by default
   and hydrates only the interactive bits (filtering, toggles) as React islands. Preserves
   SEO (real HTML, existing `sitemap.xml`/`robots.txt`) and keeps the client lean — the
   opposite of a full SPA.

3. **Data as static JSON artifacts, not an API.** Instead of an app server or API Gateway
   answering requests, a `publishSite` Lambda queries Postgres after each sync and writes
   plain `/data/*.json` files to S3. React islands `fetch()` those from CloudFront. No
   per-request compute, no API tier to run or secure.

4. **NAT-free serverless via fetch/load split.** The only thing that forced the VPC/NAT
   cost was the in-VPC sync Lambdas reaching the external Sleeper API. We split each sync
   step: a **`fetch*` Lambda with no VPC** (free internet egress to Sleeper) and a
   **`load*` Lambda in the VPC** (writes to RDS privately, reads S3 via a free gateway
   endpoint). The large daily players payload (~5 MB) is handed off through S3
   (claim-check). Result: no NAT, no IGW, no public IP.

5. **Managed over self-managed.** RDS (backups/patching/encryption), CloudFront + ACM (TLS
   auto-renewal), and Secrets Manager replace hand-rolled equivalents. Less ops, smaller
   attack surface.

6. **Strangler-style migration, reuse the core.** Stand the new stack up *alongside* the
   old, validate, cut over, then decommission. The existing domain logic — Drizzle
   schema/queries in [src/db/](src/db/), the Sleeper client + Zod schemas in
   [src/lib/](src/lib/), and the query services in [src/services/](src/services/) — is
   **reused as a shared core**. The rewrite is the *edges* (frontend, infra, handler
   wiring), not the business logic.

---

## Technology Stack

| Concern | Technology | Role / why | Status |
|---|---|---|---|
| Static site framework | **Astro** (static output, no SSR adapter) | MPA, zero-JS-by-default HTML, native Sass + Vite, island hydration | New |
| Interactive UI | **React** (Astro islands, `client:visible`/`client:load`) | Filtering/toggles only, ported from existing client TS | New (ports [public-ts/](public-ts/)) |
| Styling | **Sass** (existing `public/scss`) via Astro/Vite | Keep current styles, minimal rework (Tailwind is the alt) | Reuse |
| Language | **TypeScript** end-to-end | Already the project standard | Reuse |
| Bundling | **Vite** (Astro) for web; **esbuild** via CDK `NodejsFunction` for Lambdas | Matches existing `NodejsFunction` usage | Reuse/New |
| Edge / CDN + TLS | **Amazon CloudFront** + **ACM** cert + **Origin Access Control** | HTTPS, caching, S3 locked to OAC; replaces nginx + Let's Encrypt | New |
| Static + data hosting | **Amazon S3** (private bucket) | Astro output + `/data/*.json`; SSE encryption | New |
| DNS | **Amazon Route 53** (existing `bleedblue.football` zone) | Alias records → CloudFront | Reuse |
| Database | **Amazon RDS for PostgreSQL** (`db.t4g.micro`, single-AZ, isolated subnets, `storageEncrypted`) | Managed, private, no egress needed for patching | New (replaces EC2 Postgres) |
| ORM / migrations | **Drizzle ORM** + drizzle-kit | Unchanged; run migrations against RDS | Reuse [src/db/](src/db/) |
| Compute | **AWS Lambda** (Node, ARM) — `fetch*` (no VPC) / `load*` + `publishSite` (in VPC) | Sync + publish; no app server | New wiring, reuses [src/services/](src/services/) |
| Orchestration | **AWS Step Functions** + **EventBridge** (cron) | Existing gate→chain pattern, retained | Reuse [infra/lib/infra-stack.ts](infra/lib/infra-stack.ts) |
| External data | **Sleeper API** via existing client + **Zod** validation | Unchanged ingestion + runtime validation | Reuse [src/lib/](src/lib/) |
| Secrets | **AWS Secrets Manager** (RDS-generated creds) | Injected into Lambdas via SDK, not plaintext env | New |
| VPC networking | **Isolated subnets (2 AZs)** + **S3 gateway VPC endpoint** (free) | RDS + in-VPC Lambdas only; no IGW/NAT | New (slim) |
| IaC | **AWS CDK** (TypeScript) | All of the above provisioned reproducibly | Reuse/rewrite |
| CI/CD | **GitHub Actions** + **OIDC** (existing role, re-scoped) | `astro build` → `s3 sync` → CF invalidation; drops SSM | Reuse [infra/lib/cicd/cicd.ts](infra/lib/cicd/cicd.ts) |

---

## Target Architecture

```
                 ┌──────────── CI (GitHub Actions, OIDC) ────────────┐
                 │  astro build → aws s3 sync → CF invalidation       │
                 └────────────────────────────────────────────────────┘
 Browser ──HTTPS──► CloudFront ──OAC──► S3  (Astro static HTML/CSS/JS  +  /data/*.json)
            (ACM cert, Route53 alias: bleedblue.football)        ▲
                                                                 │ writes page JSON
        ┌─────────────────── Sync Step Function (every ~15 min, in-season) ───────────────────┐
        │  scheduleGate → [ fetchSleeper (NO VPC, internet) → loadToRds (IN VPC, private) ]…   │
        │                                            └─ large payloads handed off via S3 ─┐    │
        │  → publishSite (IN VPC: query RDS → render JSON → S3)  ◄───────────────────────┘    │
        └──────────────────────────────────────────────────────────────────────────────────────┘
                                                  │ private subnet (no IGW, no NAT)
                                                  ▼
                                         RDS Postgres (db.t4g.micro, isolated subnets,
                                         encrypted, automated backups, not public)
                                                  ▲ S3 gateway VPC endpoint (free)
```

**Caching strategy (handles the data-freshness worry):** Astro assets are content-hashed
with long `Cache-Control` (invalidated only on deploy). `/data/*.json` is served with a
short TTL (e.g. `max-age=60`) so islands get fresh data with **no per-sync CloudFront
invalidation**; off-season the data is unchanged so everything is cache hits. (Avoids the
~2,880 invalidations/mo that a per-sync invalidation would incur.)

---

## Cost & Security Rationale

**Estimated monthly cost (us-east-1, approximate — list pricing, not measured):**

| Component | Est. /mo | Notes |
|---|---|---|
| RDS `db.t4g.micro` single-AZ + ~20 GB gp3 | ~$14 | Dominant line; managed, encrypted, auto-backup |
| S3 + CloudFront | <$1 | Small site; CF free tier first 12 mo |
| Route 53 hosted zone + queries | ~$0.50 | Already paying |
| Lambda + Step Functions + EventBridge | <$1 | In-season only (~5 mo/yr) |
| ACM cert | $0 | Free |
| **Total** | **~$15–17 in-season, ~$14–15 off-season** | vs. **~$32 today** |

**Security improvements:**
- **No public compute** — nginx proxy and app server (both attack surface) deleted; edge
  TLS via CloudFront + ACM auto-renew (no Let's Encrypt cron).
- **No public IPv4, no IGW, no NAT.** RDS in isolated subnets, `publiclyAccessible: false`,
  SG ingress only from the `load`/`publish` Lambda SG.
- **Encryption at rest explicit:** RDS `storageEncrypted: true`; S3 SSE (was unset on the
  current EBS volumes).
- **Secrets in Secrets Manager**, injected via SDK (Parameter Store SecureString is the
  cheaper alternative).
- **CI least-privilege:** OIDC role narrowed to `s3:PutObject` on the site bucket +
  `cloudfront:CreateInvalidation`; drop the `ssm:SendCommand` path.

**Fallback** if the fetch/load split is too much refactoring: keep sync Lambdas in-VPC and
retain one `fck-nat` (~$6.6/mo). Simpler, ~$6/mo more, still deletes proxy + app + 1 public
IP. The NAT-free split is the recommended path.

---

## Work Breakdown

### 1. Frontend → Astro + React islands (largest effort)
- New Astro MPA replacing the Pug views — one page per existing route: `index`,
  `matchups/[league]/[week]`, `champions-hall`, `sacko-hall`, `rivalry`, `league-stats`,
  plus `sitemap.xml`/`robots.txt`.
- React islands only where interactivity exists (filtering); port logic from
  [public-ts/](public-ts/) (e.g. [matchups.ts](public-ts/matchups.ts),
  [league-stats.ts](public-ts/league-stats.ts), `shared/`).
- Islands fetch `/data/*.json` whose shapes come from the existing web query services in
  [src/services/web/](src/services/web/) — reuse to keep parity. Keep existing Sass from
  `public/scss`.

### 2. Backend services → Lambdas (reuse the core)
- **Split sync handlers** in [infra/lib/lambda-handlers/](infra/lib/lambda-handlers/): each
  handler that today does `fetch(APP_URL/api/sync/*)` becomes a `fetch*` (no-VPC, Sleeper
  client + Zod from [src/lib/](src/lib/)) + a `load*` (in-VPC, writes via
  [src/db/](src/db/) + [src/services/api/](src/services/api/)). Moves DB writes out of the
  deleted app server into the Lambdas.
- **`publishSite` Lambda** (new, in-VPC): end of the Step Function; queries RDS via
  [src/services/web/](src/services/web/) and writes page JSON to S3.
- **Bootstrap** ([src/routes/api/bootstrap-route.ts](src/routes/api/bootstrap-route.ts),
  `bootstrap-new-season-route.ts`) → manually-invoked Lambda/Step Function reusing the same
  services (no public API Gateway).
- Keep `scheduleGate`
  ([scheduleGateHandler.ts](infra/lib/lambda-handlers/scheduleGateHandler.ts)) + the
  EventBridge/Step Functions orchestration largely as-is.

### 3. Infra (CDK) rewrite — [infra/lib/infra-stack.ts](infra/lib/infra-stack.ts)
- **Remove:** `NatInstanceProviderV2`, `ReverseProxyInstance`, `AppInstance`, their SGs,
  `EicEndpoint` (RDS doesn't need it), compute public subnets, and the SSM `APP_URL`
  plumbing.
- **VPC slimmed to:** isolated subnets in 2 AZs (RDS subnet group needs 2), no IGW/NAT,
  + S3 gateway endpoint.
- **Add:** `rds.DatabaseInstance` (Postgres, `t4g.micro`, isolated, encrypted, Secrets
  Manager creds, backups, deletion protection); S3 site bucket + CloudFront (OAC, ACM cert
  in us-east-1, `bleedblue.football` alias, MPA error routing); Route 53 alias records.
- **Lambda wiring:** `load*`/`publishSite` get VPC + RDS SG + Secrets read; `fetch*` get
  none; `publishSite` gets `s3:PutObject`.
- **CI/CD** ([infra/lib/cicd/cicd.ts](infra/lib/cicd/cicd.ts) +
  [.github/workflows](.github/workflows)): replace `ssm:SendCommand` with `astro build` →
  `s3 sync` → `cloudfront:CreateInvalidation`.

### 4. Data migration (one-time)
- Run Drizzle migrations against RDS ([drizzle.config.ts](drizzle.config.ts),
  [src/db/migrations/](src/db/migrations/)); `pg_dump` from `DbInstance` → `pg_restore` into
  RDS; verify per-table row counts match.
- Cut DNS over after validation; decommission the four EC2 instances + EIP; confirm the
  Cost Explorer run-rate drops.

---

## Suggested Sequencing
1. Stand up RDS + slimmed VPC alongside the existing stack; migrate data; point the current
   app at RDS to validate parity (de-risks the DB move alone).
2. Build the Astro frontend + `publishSite` Lambda; verify the static site + JSON islands
   against RDS data.
3. Split sync Lambdas (fetch/load); cut the Step Function over; delete app/proxy/NAT.
4. Swap CI/CD to the S3 deploy path; remove SSM.

## Verification
- `cdk synth` + `cdk diff`; confirm no IGW/NAT/public IP, RDS `publiclyAccessible:false`,
  encryption flags set, SGs least-privilege.
- Data migration: row-count parity between EC2 Postgres and RDS for every table.
- Start the Sync state machine **out of season** (bypass gate): confirm `fetch*` reach
  Sleeper, `load*` update RDS, `publishSite` writes `/data/*.json`, CloudFront serves fresh
  JSON within the TTL.
- Load `https://bleedblue.football` via CloudFront: pages render server-static, React
  islands hydrate, filtering works, `sitemap.xml`/`robots.txt` present.
- Confirm the Cost Explorer run-rate trends toward ~$15/mo after decommission.
