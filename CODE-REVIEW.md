# Code Quality Review — Serverless Redesign Branch

**Scope reviewed:** `master` @ `509c7f2` working tree — [REDESIGN.md](REDESIGN.md) (new) and the
one-line renewal fix in [infra/DEPLOYMENT.md](infra/DEPLOYMENT.md#L175-L185) — plus the
application and infrastructure code that document designates as the "shared core to reuse."

**Verdict: request changes on [REDESIGN.md](REDESIGN.md) before any code is written.**

The document is genuinely good on the axes it set out to optimize. The cost analysis is honest
(list pricing, labelled approximate), the security reasoning is correct, the decisions are stated
rather than implied, and the strangler sequencing is the right migration shape. The
`DEPLOYMENT.md` fix is correct and the "verify it actually renews" step is exactly the right
lesson to write down.

But it is a *cost and security* plan wearing the clothes of an *architecture* plan. Judged as a
plan for the codebase's structure, it preserves this repo's two largest sources of incidental
complexity, introduces a third, and schedules the largest workstream on top of a core that has a
dependency pointing at a layer the plan deletes. The single biggest code-quality win available in
this migration — the one that deletes ~1,900 lines outright — is never named in the document.

---

## P0 — Structural: the biggest available simplification is unnamed

### F1. Every view in this app is implemented twice, in two languages. That is the prize.

This is the finding that should reshape the document.

Server-side rendering lives in [views/mixins/](views/mixins/) as Pug. Client-side re-rendering
lives in [public-ts/](public-ts/) as hand-written HTML-string builders. They are not "related" —
they are line-by-line parallel implementations of the same markup. Compare
[views/mixins/standings-row.pug](views/mixins/standings-row.pug#L9-L37) with
[public-ts/matchups.ts:719-765](public-ts/matchups.ts#L719-L765): same `<tr>`, same
`.standings-row-link`, same `placehold.co/50` fallback, same `loading="lazy" decoding="async"`,
same nested `<dialog class="rosters-modal">`, same three `playerList` calls. The pairing repeats
across the whole view layer — `matchup-card`, `matchup-card-body`, `matchup-modal`, `player-row`,
`player-list`, `bracket`, `bracket-matchup-card`, `bracket-matchup-modal`, `week-select`,
`stats-card`.

The scale: 28 `render*` functions across [public-ts/matchups.ts](public-ts/matchups.ts),
[public-ts/league-stats.ts](public-ts/league-stats.ts) and
[public-ts/rivalry.ts](public-ts/rivalry.ts), inside ~2,120 lines of client code that exists
almost entirely to duplicate the Pug templates so a `<select>` change can re-render without a page
load.

**The duplication has already diverged, and it took a business rule with it.**
`resolveAvatarSrc` in [src/lib/helpers.ts:63-71](src/lib/helpers.ts#L63-L71) is the canonical
"which avatar do we show" rule. Pug calls it properly via `app.locals.avatarSrc`
([src/index.ts:57](src/index.ts#L57), used at
[standings-row.pug:4](views/mixins/standings-row.pug#L4)). The client does not import it — it
reimplements it as a local `isTwistedTitTeas` helper at
[public-ts/matchups.ts:141](public-ts/matchups.ts#L141) and then inlines the ternary *twice inside
one function*, at [matchups.ts:722-724](public-ts/matchups.ts#L722-L724) and again at
[matchups.ts:748](public-ts/matchups.ts#L748). Three copies of one rule, one of which is a
hardcoded username check. That is what unmanaged duplication does over time, and it will keep
doing it.

**Why this matters to the plan.** [REDESIGN.md](REDESIGN.md) §Work Breakdown item 1 says: *"React
islands only where interactivity exists (filtering); **port logic** from public-ts."* Porting
preserves the duplication. It carries 28 string-builders into JSX and leaves you maintaining two
renderers again — now Astro components *and* React components — with the same drift pressure.

The move is not "port `public-ts`." It is **delete `public-ts`.** Astro + React is the one stack
where a single component definition serves both the static render and the hydrated re-render.
Every `renderX` function and its paired `.pug` mixin collapse into one component. `escapeForHTML`
([public-ts/shared/lib.ts:16](public-ts/shared/lib.ts#L16)) and its duplicate `esc`
([public-ts/league-stats.ts:185](public-ts/league-stats.ts#L185)) both disappear, because JSX
escapes structurally — which also removes the manual-escaping XSS surface that hand-built
`innerHTML` strings carry.

This reframes the whole effort. The document currently justifies the frontend rewrite as a
consequence of the cost migration ("largest effort"). It is the reverse: **collapsing the dual
render path is the largest standalone quality win in the repo, and the migration is what pays for
it.** Say that in the document, and make "no view markup is defined twice" an explicit exit
criterion in §Verification.

---

### F2. The file the plan calls "reuse" is 1,296 lines, and ~600 of them are copy-paste.

[src/db/queries/league-stats.ts](src/db/queries/league-stats.ts) is the largest source file in the
repo and it is already over the 1k line threshold *before* this work adds anything. The plan lists
[src/db/](src/db/) under "Reuse" without qualification.

The bulk of it is mechanical duplication. There are six all-time query functions and six
season-scoped ones, and each pair is the same query with a single added predicate:

| All-time | Season-scoped | Delta |
|---|---|---|
| `selectTheBigNumbers` ([:102](src/db/queries/league-stats.ts#L102)) | `selectSeasonBigNumbers` ([:745](src/db/queries/league-stats.ts#L745)) | `where(eq(mo.leagueId, leagueId))` |
| `selectScoringRecords` ([:239](src/db/queries/league-stats.ts#L239)) | `selectSeasonScoringRecords` ([:758](src/db/queries/league-stats.ts#L758)) | same |
| `selectPointMargins` ([:359](src/db/queries/league-stats.ts#L359)) | `selectSeasonPointMargins` ([:918](src/db/queries/league-stats.ts#L918)) | same |
| `selectLeaderboard` ([:473](src/db/queries/league-stats.ts#L473)) | `selectSeasonLeaderboard` ([:1097](src/db/queries/league-stats.ts#L1097)) | same |
| `selectStreaks` ([:580](src/db/queries/league-stats.ts#L580)) | `selectSeasonStreaks` ([:1018](src/db/queries/league-stats.ts#L1018)) | same |
| `selectThatsGottaHurt` ([:651](src/db/queries/league-stats.ts#L651)) | `selectSeasonThatsGottaHurt` ([:1172](src/db/queries/league-stats.ts#L1172)) | same |

Compare the module-level `mostPts` builder at
[:127-145](src/db/queries/league-stats.ts#L127-L145) against `sMostPts` at
[:758-780](src/db/queries/league-stats.ts#L758-L780): identical select shape, identical joins,
identical alias `"most_pts"`, one extra `.where()`. The same relationship holds for the CTE —
`matchupPointsCTE` ([:12](src/db/queries/league-stats.ts#L12)) is `buildSeasonCTE`
([:692](src/db/queries/league-stats.ts#L692)) with the `eq(mo.leagueId, leagueId)` conjunct
dropped.

**The judo move:** make the league filter a parameter rather than a fork. Give every builder an
optional `leagueId?: string` (or accept a `SQL | undefined` predicate and let Drizzle's `and()`
drop the `undefined`), and the twelve exports become six that take `leagueId?`. The file should
land near 500–600 lines. The duplication propagates upward too —
[src/services/web/league-stats-service.ts:18-72](src/services/web/league-stats-service.ts#L18-L72)
has `getAllTimeStats` and `getSeasonStats` as byte-identical `Promise.all` blocks over the two
function sets; parameterizing the queries collapses those into one function as well.

Two secondary smells in the same file, worth fixing while it is open:

- The typed builder is abandoned mid-query 36 times. Expressions like
  ``sql<string>`"most_pts"."team_name"` `` ([:246](src/db/queries/league-stats.ts#L246)) and the
  four inline correlated subqueries at
  [:265-290](src/db/queries/league-stats.ts#L265-L290) re-encode alias names as magic strings that
  no compiler checks. Rename an alias and these fail at runtime, in SQL, in production.
- 24 occurrences of ``.leftJoin(x, sql`true`)`` — a cross join spelled as a left join on a
  tautology. `crossJoin` says what is meant.

**This file must be decomposed and de-duplicated before it is designated "reuse."** Doing it first
also de-risks step 2 of the plan's sequencing, since `publishSite` will call directly into it.

---

### F3. The `fetch*`/`load*` split doubles the handler count to solve a problem one Lambda has.

[REDESIGN.md](REDESIGN.md) §Approach principle 4 splits *each* sync step into a no-VPC `fetch*`
and an in-VPC `load*`, handing large payloads through S3 as a claim-check.

Count what that produces. Today: 5 sync handlers + 1 gate. After: ~10 handlers, an S3 claim-check
protocol, a doubled Step Function chain, and two distinct VPC/IAM configurations to keep straight
— for a pipeline that currently fits in one file per step.

Then note the justification: *"The large daily players payload (~5 MB) is handed off through S3."*
That is **one** step. `syncLeague`, `syncUsers`, `syncRosters`, `syncLeagueState` all move small
payloads. The plan applies a uniform split to six pipelines to accommodate the constraint of one,
and the uniformity is presented as elegance when it is really a special case promoted to a default
— exactly the shape the review bar treats as a presumptive blocker.

Note also what is being split. The five handlers today are pure copy-paste — compare
[syncLeagueHandler.ts](infra/lib/lambda-handlers/syncLeagueHandler.ts),
[syncUsersHandler.ts](infra/lib/lambda-handlers/syncUsersHandler.ts),
[syncRostersHandler.ts](infra/lib/lambda-handlers/syncRostersHandler.ts),
[syncPlayersHandler.ts](infra/lib/lambda-handlers/syncPlayersHandler.ts) and
[syncLeagueStateHandler.ts](infra/lib/lambda-handlers/syncLeagueStateHandler.ts): 26 lines each,
differing only in a URL segment and a noun in two log lines. Splitting each into two without first
collapsing them means shipping ten copies of a function that should exist once.

**Recommendation.** Once the app server is deleted, the entire "Lambda calls an HTTP endpoint that
calls a service" indirection collapses — each handler becomes a direct call into
[src/services/api/](src/services/api/). Start from that: one thin handler per sync step, or one
handler parameterized by step. Then apply the fetch/load split **only where a payload actually
requires it**, and say in the document that it is a targeted exception with a named reason. If
every step must genuinely be split, that needs an argument the document does not currently make.

---

### F4. The plan never asks whether a live RDBMS needs to exist at runtime.

This is the deepest structural question, and the document skips straight past it — RDS appears
under "Decisions locked in" with the justification *"it lets us delete NAT / proxy / app server /
public subnets."* That reasoning is circular: it justifies RDS by the things RDS is not, not
against alternatives.

Follow the plan's own architecture. Principle 3 says *"Data as static JSON artifacts, not an
API"* — the browser never touches the database. Post-migration the DB serves **zero user
requests**. It is a batch store, written by a serial Step Function every ~15 minutes for roughly
five months a year, and read once per cycle by `publishSite`.

Now look at what that batch store costs, by the document's own table:

- **~$14 of the ~$15 target — 93% of the budget** — for a database on nobody's request path.
- It is the sole reason the VPC exists. Delete RDS and you also delete: isolated subnets across 2
  AZs, the S3 gateway VPC endpoint, the RDS security group, the Lambda-in-VPC configuration,
  Secrets Manager, **and the entire `fetch*`/`load*` split from F3** — which exists only because
  in-VPC Lambdas cannot reach the internet.

So the single locked-in decision is generating most of the cost *and* most of the remaining
architectural complexity. That deserves to be argued, not assumed. Options worth a paragraph each
before committing:

1. **Managed Postgres outside AWS** (Neon, Supabase — free tiers cover a workload this size).
   Real Postgres over TLS: [src/db/](src/db/), Drizzle, the migrations and every CTE in F2 work
   unchanged. No VPC, no NAT, no subnets, no gateway endpoint, no split — Lambdas connect
   directly. Cost approaches zero. Trade-off: a second vendor, credentials outside AWS, and
   free-tier idle-suspend latency on the first query of a cycle (fine for a batch pipeline,
   irrelevant to users who only ever hit CloudFront).
2. **Embedded Postgres over a file in S3** (PGlite via `drizzle-orm/pglite`): `publishSite` pulls
   the file, runs queries, writes back. Single-writer is not a constraint here because the Step
   Function is serial. Cost ~$0, nothing to operate. Trade-off: needs a spike — the window
   functions, `regexp_matches` and correlated subqueries in
   [league-stats.ts](src/db/queries/league-stats.ts) must be verified against PGlite before this
   is credible. Higher risk than option 1.
3. **Keep RDS**, because it is familiar, in-account, and backed up without thought. Legitimate —
   but then say so as a decision, with "$14/mo and a VPC is what that familiarity costs," rather
   than presenting it as the only path.

I am not asserting option 1 or 2 is correct; I do not have the query-compatibility evidence for
option 2 and vendor preference is the author's call. The blocking issue is that the document
**locks in the most expensive and most complexity-generating option without comparing it to
anything**, and every other piece of remaining complexity in the design is downstream of it.

---

## P1 — Boundary and dead-weight problems in the "reusable core"

### F5. The service layer imports from the layer the plan deletes.

[src/services/web/matchups-page-service.ts:1](src/services/web/matchups-page-service.ts#L1) imports
`MatchupsPageParams` from `../../api/matchups-page.js`.
[src/services/web/rivalry-service.ts:7](src/services/web/rivalry-service.ts#L7) imports
`RilvaryPageParams` from `../../api/rivalry-page.js`. Services are supposed to be the layer
*below* handlers; here they reach up into the Express handler layer for their input types.

Under [REDESIGN.md](REDESIGN.md) §3 the `src/api/` layer is deleted along with the app server. So
the "shared core we reuse" currently will not compile once the plan's own deletions land. Fix the
direction first: these are domain inputs, and they belong beside the service or in a shared types
module — not in a handler file.

Two related defects in the same seam:

- `MatchupsPageParams` is declared **twice**, identically, at
  [src/api/matchups-page.ts:5-8](src/api/matchups-page.ts#L5-L8) and
  [src/web/matchups.ts:6-9](src/web/matchups.ts#L6-L9), and a third consumer imports the first.
- The typo `Rilvary` has been load-bearing long enough to reach a filename
  ([src/routes/api/rilvary-page-route.ts](src/routes/api/rilvary-page-route.ts)) and an exported
  type name. Fix it during the move, while it is cheap.

### F6. Nine routes are labelled dead, and the label is wrong in a way that will break sync.

[src/index.ts:18](src/index.ts#L18) marks a block `// unused`, and
[:93](src/index.ts#L93) says *"we don't use these but we will keep them around since they are
built out, maybe we use them one day."* Nine route files plus nine handler files are retained on
that basis.

The comment is false, and dangerously so:
[syncMatchupsHandler.ts:5](infra/lib/lambda-handlers/syncMatchupsHandler.ts#L5) fetches
`${APP_URL}/api/league-state` and reads `stateData.leagueState.seasonType` to choose between the
regular and post-season sync endpoints. That is `apiLeagueStateRoute`
([src/index.ts:97](src/index.ts#L97)) — one of the routes in the "we don't use these" block.
Anyone who trusts the comment and deletes the block silently breaks matchup sync.

Resolve it in one direction or the other before the migration inventories what to port: delete the
genuinely unused routes, and move the one real dependency out of the "unused" block with a comment
saying what depends on it. Carrying eighteen files of speculative surface into a rewrite is
exactly the debt a rewrite is supposed to shed.

### F7. Dead branches and redundant guards in the busiest service function.

[assembleMatchupsPageData](src/services/web/matchups-page-service.ts#L23-L71):

- [:32-45](src/services/web/matchups-page-service.ts#L32-L45) — `weekNanCheck` is computed, then
  the guard on [:35](src/services/web/matchups-page-service.ts#L35) throws whenever it is true. By
  [:45](src/services/web/matchups-page-service.ts#L45) it is provably `false`, so
  `weekNanCheck ? leagueState.displayWeek : parsedWeek` has an unreachable arm. The
  `leagueState.displayWeek` default it implies is dead intent, not live behavior.
- In that same guard, `weekNanCheck ||` is redundant: `isNaN(parsedWeek)` already implies
  `!Number.isInteger(parsedWeek)`.
- [:30](src/services/web/matchups-page-service.ts#L30) — `leagueIdParam ?? config.league.id` never
  falls back; `:leagueId` is a required Express route param
  ([routes/web/matchups.ts:12](src/routes/web/matchups.ts#L12)). Optionality that models nothing.
- [:73-104](src/services/web/matchups-page-service.ts#L73-L104) and
  [:145-176](src/services/web/matchups-page-service.ts#L145-L176) —
  `assemblePostSeasonMatchupsData` and `assembleRegularSeasonMatchupsData` are the same function.
  Same `Promise.all` triple, same `currentLeague` lookup, same `NotFoundError`, same eight-key
  return. They differ in one query call and one transform. Pass those two in.

### F8. One domain rule, copied into three places.

The "env vars point at a season the data doesn't have yet" rule appears at
[src/web/matchups.ts:35-38](src/web/matchups.ts#L35-L38) and again at
[src/services/web/matchups-page-service.ts:15-20](src/services/web/matchups-page-service.ts#L15-L20),
both spelled `!leagueState.isLeagueActive && leagueState.season !== config.league.season`, each
with its own explanatory comment. It drives a redirect target in one place and a dropdown filter in
the other.

That is a missing concept. It wants to be one predicate — `isEnvAheadOfLeagueState(leagueState)`,
or better, a resolved `activeLeagueId` on a league-state module — used by both callers. As written,
a rule change requires finding all copies, and the comments will drift apart first.

---

## P2 — Duplication and contract cleanups

### F9. `matchups-service.ts` repeats itself three ways.

- [buildRegularSeasonLeagueMatchups:66](src/services/api/matchups-service.ts#L66) and
  [buildPostSeasonLeagueMatchups:87](src/services/api/matchups-service.ts#L87) are identical apart
  from the `weeks` array. One function, `weeks` as an argument.
- [syncPostSeasonMatchups:25](src/services/api/matchups-service.ts#L25),
  [syncRegularSeasonMatchups:32](src/services/api/matchups-service.ts#L32) and
  [buildAndInsertLeagueMatchupHistory:39](src/services/api/matchups-service.ts#L39) are three
  copies of `build → insert → return`.
- The comment at
  [:49-51](src/services/api/matchups-service.ts#L49-L51) explains that `Promise.all` is used
  *"because of the relationship chain: a league must exist, a sleeper user must exist…"*.
  `Promise.all` over a chunk guarantees no ordering at all — if the chain were the reason, this
  code would be wrong. The chunking is throughput control; the comment describes a constraint the
  code does not implement. Per the repo's own comment policy, rewrite it to say what the chunk
  size is actually for, or delete it.

### F10. Canonical helpers duplicated across the client/server boundary.

`Sleeper.fetchJSON` ([src/lib/sleeper.ts:137-150](src/lib/sleeper.ts#L137-L150)) and
`fetchJSON` ([public-ts/shared/lib.ts:1-14](public-ts/shared/lib.ts#L1-L14)) are the same function
down to the error strings — `HTTP ${status} at ${url}`, `Expected JSON, received ${contentType}`.
Same story for `escapeForHTML` vs `esc` (F1). Under the plan the islands fetch `/data/*.json`, so
this helper is about to get a third caller. Give it one home in shared code now.

Minor, same file: [Sleeper](src/lib/sleeper.ts#L21-L28) declares `leagueId` and `baseURL` as
`readonly` field initializers and then assigns both again in the constructor. The class holds no
state and every method is a pure fetch-and-parse — a module of functions would be the more direct
shape, and would drop the `new Sleeper()` repeated in every service.

### F11. Async functions that never await; an order-dependent error chain.

`respondWithJSON` and `respondWithError` ([src/lib/json.ts](src/lib/json.ts)) are declared `async`
with nothing to await, and every call site ignores the returned promise
(e.g. [src/api/sync.ts:21](src/api/sync.ts#L21)). `errorHandler`
([src/middleware/error-handler.ts:4](src/middleware/error-handler.ts#L4)) is likewise `async` —
and Express 5 will treat a rejected error-handler promise differently than the sync path, so the
`async` is not merely cosmetic there. Drop it in all three.

Related: the terminal chain at [src/index.ts:104-109](src/index.ts#L104-L109) is
`errorHandler` (4-arg) → `handlerServeNotFound` (3-arg) → `handlerServeErrorPage` (4-arg), and
correctness depends entirely on Express's arity dispatch plus the `next(err)` bail-out for
non-`/api/` paths at
[error-handler.ts:10](src/middleware/error-handler.ts#L10). It works, but which of the three
handles a given failure is not readable from the code. Worth a short comment or an explicit split
of the API and web error paths — particularly since the API half is scheduled for deletion.

### F12. CI builds an artifact and throws it away.

[.github/workflows/cd.yml](.github/workflows/cd.yml) runs `npm ci && npm run build` in the `build`
job, keeps nothing, and then the `deploy` job has the instance `git reset --hard` and rebuild from
source over SSM. The build job is a duplicate smoke test of `ci.yml`.

The plan replaces this path with `astro build → s3 sync`, which is the chance to fix it properly:
build once, upload the artifact, and let deploy ship *that* — so what was tested is what ships.
Worth naming in §Work Breakdown item 3 rather than leaving as a mechanical swap of `ssm:SendCommand`
for `s3:PutObject`.

### F13. The rewritten stack will blow past 1k lines in one file.

[infra/lib/infra-stack.ts](infra/lib/infra-stack.ts) is 282 lines today and already carries a
standing note at [:15](infra/lib/infra-stack.ts#L15): *"should look into splitting code into
separate stacks."* The plan adds an RDS instance, an S3 bucket, a CloudFront distribution with OAC,
an ACM cert, Route 53 records, Secrets Manager wiring, and roughly ten Lambdas with two distinct
networking profiles — into that same constructor.

Decompose as part of the work, not after: `Network`, `Data`, `Site`, `SyncPipeline`, `Cicd`
constructs, composed by the stack. [GithubActionsOidc](infra/lib/cicd/cicd.ts) already shows the
pattern works here. This also fixes the coupling the current file demonstrates — `GithubActionsOidc`
takes an `appInstanceId` string ([cicd.ts:11](infra/lib/cicd/cicd.ts#L11)) purely because the deploy
mechanism is SSM-to-an-instance; a `Cicd` construct that receives a bucket and distribution keeps
that boundary clean instead of re-tangling it.

---

## Against the approval bar

| Criterion | Status |
|---|---|
| No missed opportunity for dramatic simplification | **Fails** — F1 (delete the dual render path, ~1,900 lines), F2 (~600 lines of duplicated SQL), F4 (the DB decision that generates most of the remaining complexity) |
| No unjustified file-size explosion | **Fails** — F2 is already 1,296 lines and marked "reuse"; F13 will push the CDK stack past 1k |
| No spaghetti growth from special-case branching | **Fails** — F3 promotes a one-Lambda payload constraint into a uniform six-pipeline split |
| No architecture-boundary leak | **Fails** — F5, services importing from the layer the plan deletes |
| No canonical-helper duplication | **Fails** — F1 (`resolveAvatarSrc` ×3), F10 (`fetchJSON`, `escapeForHTML`) |
| No structural regression introduced | Passes — the target architecture is a real improvement over three EC2 tiers |
| Cost and security reasoning | **Passes, and is the document's strength** |

## Suggested revisions to the plan

1. **Reframe item 1.** Replace *"port logic from `public-ts`"* with *"delete `public-ts`; every
   Pug mixin and its paired `renderX` become one component."* Add "no view markup is defined
   twice" to §Verification. This is the headline outcome, not a side effect.
2. **Add a step 0: pay down the core before reusing it.** De-duplicate and decompose
   [league-stats.ts](src/db/queries/league-stats.ts) (F2), invert the service→api imports (F5),
   and resolve the false "unused" comment (F6). All three are behavior-preserving, all three are
   cheaper now than mid-migration, and step 2 of the current sequencing depends on all of them.
3. **Reopen the database decision (F4)** with a short comparison of managed-external Postgres vs.
   embedded/S3 vs. RDS. If RDS wins, record *why* — the current text asserts rather than argues,
   and 93% of the budget plus the whole VPC and the fetch/load split ride on it.
4. **Downgrade the fetch/load split to a targeted exception (F3),** applied where a payload
   requires it. Collapse the five duplicated handlers first so the split operates on one
   implementation rather than five.
5. **Name the CDK decomposition (F13)** as deliverable work in item 3, with the construct
   boundaries chosen up front.

Nothing here argues against the migration. The destination is right and the reasoning that got
there is sound. The objection is that the plan currently proposes to rebuild the edges while
carrying the interior forward unexamined — and the interior is where the duplication lives.
