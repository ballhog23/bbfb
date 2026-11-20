# Pipeline Schedule Rework — Step Functions Cost

**Date:** 2026-09-07
**Status:** Plan only. No code written.
**Trigger:** AWS free-tier notification for Step Functions state transitions. Both EventBridge rules were disabled by hand in the console as a stopgap.

---

## 1. Goal

Move the sync pipeline from a 15-minute tick with an in-workflow gate to a small number of explicit daily cron rules, and delete the gate. EventBridge owns the schedule; the state machine just does work.

---

## 2. Current state

Two rules in `infra/lib/infra-stack.ts`:

| Rule | Schedule | Target |
|---|---|---|
| `SyncChainRule` (L267) | `cron(0/15 * * 9-1 ? *)` | `bbfb-sync-chain` state machine |
| `DailySyncRule` (L273) | `cron(0 14 * 9-1 ? *)` | `syncPlayersLambda` + `syncLeagueStateLambda` (direct, no SFN) |

State machine has 7 states: `ScheduleGate` → `ShouldRun` (Choice) → either `SkipExecution` (Succeed) or `SyncLeagues` → `SyncUsers` → `SyncRosters` → `SyncMatchups`.

`SyncChainRule` is the only thing that starts the state machine. Verified: no `StartExecution` call anywhere in `src/` or `infra/`, no SFN SDK dependency, no in-process scheduler on the EC2 app. Disabling that rule stops Step Functions completely.

### Where the spend went

Standard workflows bill per state transition; free tier is 4,000/month (perpetual, not 12-month). The 15-minute tick fires 96×/day regardless of season logic, and **every tick pays for the gate even when it decides to skip** — roughly 3 transitions for a skip, 6 for a full chain run.

Using the windows in `scheduleGateHandler.ts`:

| Day | Gate window (UTC) | Runs/day | Skips/day |
|---|---|---|---|
| Sun | 12–22 | 44 | 52 |
| Mon | 19–22 | 16 | 80 |
| Tue | 14 | 4 | 92 |
| Wed | 14 | 4 | 92 |
| Thu | 19–22 | 16 | 80 |
| Fri | 14 | 4 | 92 |
| Sat | 10–18 | 36 | 60 |

≈124 real runs + 548 skips per week → **≈10,400 transitions/month, about 2.6× the free tier.** The skips alone are ≈7,100/month, already well over on their own. Retries are on top of that.

**Honest framing:** cutting frequency is the load-bearing fix, not deleting the gate. At 2 runs/day the gate would cost ~360 transitions/month and be affordable. Removing it is correctness and clarity work — one schedule in one place — and it happens to be free. Conversely, deleting the gate but keeping the 15-minute tick still lands at ~11,500/month. Both changes are needed only because we want both outcomes.

---

## 3. Design decisions

### 3.1 Delete the gate, cron owns the windows

Remove `scheduleGateLambda`, the `ScheduleGate` task, the `ShouldRun` choice, and `SkipExecution`. The definition becomes a straight chain.

The gate's off-season check (skip months Feb–Aug) is already equivalent to the cron `month: '9-1'` field, so nothing is lost. The day/hour windows become cron expressions.

### 3.2 Fold league-state sync into the chain — ordering dependency

**This is the one thing that actually breaks if we only change the schedule.**

`syncMatchupsHandler.ts` fetches `/api/league-state` and branches on `seasonType` to pick `matchups-regular` vs. `matchups-post`, and syncs nothing if it is neither. That state is written by `syncLeagueStateLambda`, which today runs on a *different* rule at 14:00 UTC.

At a 15-minute cadence the staleness is invisible — a wrong read self-corrects within the hour. At twice a day, a chain run can execute against a league state up to 24 hours old. During the regular→post transition that means a full day of matchups syncing to the wrong endpoint, or silently not syncing at all.

**Move `syncLeagueStateLambda` into the state machine as the first step**, ahead of the chain. Leave `syncPlayersLambda` on its own daily rule — the player list is large, slow-moving, and nothing in the chain reads it.

New chain: `SyncLeagueState` → `SyncLeagues` → `SyncUsers` → `SyncRosters` → `SyncMatchups` = 5 states.

`syncLeagueStateLambda` is already built by `makeLambda` with `retryAttempts: 0`, which is the correct setting for an SFN-invoked function, so no change needed there.

### 3.3 Schedule shape

**Option A — flat twice daily (matches the stated plan).**

Two rules, or one rule with two cron entries. 2 × 30 × 5 = **300 transitions/month, ~7.5% of free tier.**

Times are a product decision, not a cost one. A reasonable default is one run in the early UTC morning (catches everything from the previous day's games after overnight stat corrections settle) and one mid-afternoon UTC. Pick against when Sleeper actually settles scoring, not against a round number.

**Option B — twice daily plus live Sunday scoring.**

Worth knowing before committing to Option A: the free tier comfortably covers keeping Sunday live.

- Sunday 15-min window, 10 hours: 44 runs × 5 = 220/Sunday → ≈960/month
- Twice daily the rest of the week: ≈260/month
- **Total ≈1,250/month, ~31% of free tier**

This preserves live matchup scores on game day, which is presumably the reason the 15-minute tick existed. Option A gives that up — during Sunday games the site will show scores hours old. Flagging it as a product consequence, not arguing for it.

Recommendation: take Option A if the stale Sunday is genuinely fine; take Option B if it is not. Both are safely inside free tier.

---

## 4. Verify before implementing

Two things I could not confirm from source. **The `aws-mcp` server failed to connect this session (`-32602: Invalid request parameters`), so nothing below was checked against live AWS** — all analysis is from the CDK source.

### 4.1 The gate windows look like ET numbers in a UTC field

`scheduleGateHandler.ts` reads `now.getUTCHours()`, so the windows are UTC. Converted to Eastern:

| Window | UTC | ET | Actual game time |
|---|---|---|---|
| Sunday | 12–22 | 07:00–17:00 EST | 1pm slot ✅, 4:25pm slot partial, **SNF (8:20pm) missed** |
| Monday | 19–22 | 15:00–18:00 EST | **MNF kicks off 8:15pm ET — never covered** |
| Thursday | 19–22 | 15:00–18:00 EST | **TNF kicks off 8:15pm ET — never covered** |

If that reading is right, the MNF and TNF windows have been burning ~32 executions/week producing nothing new, and Sunday never covered the primetime game. Final results still landed via the next morning's once-daily run, which is why it would not have been visible as a bug.

**Do not port these numbers verbatim into cron.** Confirm the intent first. If Option B is chosen, the Sunday window should probably be ~17:00–04:00 UTC to cover 1pm ET through the end of SNF.

Also note Saturday 10–18 UTC is 36 runs/week, the second-largest consumer, and the NFL rarely plays Saturdays before late December.

### 4.2 Cron month wrap-around

Both rules use `month: '9-1'`. AWS does not clearly document wrap-around ranges in the month field. The rules deployed and are firing, so it was accepted, but confirm it actually fires in Nov/Dec/Jan rather than silently narrowing. Safer explicit form: `'9-12,1'`. Low risk, worth removing the ambiguity while the file is open.

---

## 5. Change list

**`infra/lib/infra-stack.ts`**
- Delete the `scheduleGateLambda` construct (L188–195).
- Delete `gateStep`, `shouldRunChoice`, `skipExecution`.
- Add a `SyncLeagueState` `LambdaInvoke` task with `retryPolicy` and `resultPath: sfn.JsonPath.DISCARD`; make it the head of the chain.
- `definition` becomes the chain directly — no `gateStep.next(...)`.
- Replace `SyncChainRule` with the chosen cron rule(s) from §3.3.
- Drop `syncLeagueStateLambda` from `DailySyncRule` targets; it now runs inside the state machine. `DailySyncRule` keeps only `syncPlayersLambda`.
- `syncLeagueStateLambda` stays in the `allLambdas` array — it still needs the security group ingress to reach the app instance.
- Consider `'9-12,1'` per §4.2.

**`infra/lib/lambda-handlers/scheduleGateHandler.ts`**
- Delete the file.

**Comments**
- Per repo convention, delete the stale comments in the same edit — the `// EventBridge: trigger step function every 15 minutes` block, the `// gate → choice` block, the `// schedule gate lambda` block, and the `// independent lambdas: players and league state (daily schedule, not in step function)` comment, which stops being true once league state moves into the chain.

**Tests**
- `infra/test/infra.test.ts` contains a single NAT-instance assertion and does not touch the state machine, rules, or gate. Nothing breaks. There is no test for `scheduleGateHandler`.
- Optional: this is a reasonable moment to add a template assertion that the state machine definition has no `ScheduleGate` state and that the rule count and schedule expressions are what we expect — cheap regression cover for exactly the thing that just cost money.

---

## 6. Operational consequence: failures no longer self-heal

Today a failed sync is invisible because another run starts in 15 minutes. At twice a day, a failure means stale data for up to 12 hours, and nothing reports it.

Recommend adding, as part of this work:
- An EventBridge rule on `Step Functions Execution Status Change` where `status` is `FAILED` or `TIMED_OUT`, targeting an SNS topic with an email subscription. CloudWatch alarms are free up to 10, SNS email is free at this volume.
- Keep `retryPolicy` at `maxAttempts: 3` but consider raising `interval` from 10s — a Sleeper API blip or a cold app instance benefits more from a longer backoff than from three fast retries. Retried attempts bill as extra transitions, but at this volume it is noise.

Separately: `syncPlayersLambda` remains a direct async EventBridge → Lambda target with `retryAttempts: 0`, so a failed daily player sync gets exactly one attempt and no retry. That is pre-existing and out of scope, but it is the same class of problem. Either give it a non-zero `retryAttempts` or fold it into the state machine as a parallel branch.

---

## 7. Deploy sequence

1. Land the code change on `master`.
2. Run `cdk diff` and confirm: gate Lambda deleted, state machine definition updated in place, rule schedule changed. The state machine has an explicit `stateMachineName: 'bbfb-sync-chain'`, so the definition change is an in-place update, not a replacement.
3. `cdk deploy`.
4. **The rules will come back on automatically.** CDK renders `State: ENABLED` into the template whenever `enabled` is unset, so the deploy overwrites the manual console disable. That is the desired outcome here — but if the intent is to stay dark after deploying, set `enabled: false` explicitly in code, because the console state will not survive.
5. `.github/workflows/cd.yml` deploys the app over SSM and never runs `cdk deploy`, so no pipeline run will do this by surprise. Infra deploys are manual.
6. Trigger one execution by hand from the console to confirm the chain completes end to end without the gate.
7. Delete the orphaned `/aws/lambda/<gate-function-name>` log group. CloudFormation deletes the function but not the auto-created log group, since no `logRetention` or `logGroup` is configured.
8. Watch the state-transition count for a week against the ~300 (Option A) or ~1,250 (Option B) estimate.

---

## 8. Rollback

The change is one file plus one deleted handler. Revert the commit and `cdk deploy`. No data migration, no resource replacement. If something is wrong and the fix is not immediate, disable the rules in the console again — it stops all spend instantly and costs nothing while idle, since Standard workflows bill only on transitions.

---

## 9. Open questions

1. Option A or Option B — is stale Sunday scoring acceptable?
2. What are the two daily run times, chosen against when Sleeper scoring settles?
3. Is the UTC/ET reading in §4.1 correct, or were those windows deliberate?
4. Add the failure alarm now, or track it separately?
