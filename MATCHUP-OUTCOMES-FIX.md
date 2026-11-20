# Matchup Outcomes Fix

Noted 2026-10-23 (2026 season, week 7).

## Symptom

The 2026 league stats page on prod is empty, even after running `bootstrap-new-season`. The matchups page for 2026 does have data.

## Cause

The stats page reads from `matchup_outcomes`, not `matchups`.

- Only `/api/bootstrap-history` fills `matchup_outcomes`, via `buildAndInsertLeagueMatchupOutcomes()` in `src/api/bootstrap-history.ts`.
- `bootstrap-new-season` never fills it.
- None of the Lambdas fill it either. `syncMatchupsHandler` only calls `/api/sync/matchups-regular` or `/api/sync/matchups-post`, and neither handler in `src/api/sync.ts` touches outcomes.

## Catch: unplayed weeks become ties

`syncRegularSeasonMatchups` stores all 14 weeks, including weeks that haven't been played yet (0 vs 0).

`selectLeagueMatchupOutcomes` (`src/db/queries/matchup-outcomes.ts`) has no filter for completed weeks. `normalizeMatchupOutcome` (`src/services/api/matchups-outcomes-service.ts`) scores equal points as `"T"`, and the stats queries in `src/db/queries/league-stats.ts` don't filter those rows out.

So rebuilding outcomes in the middle of the season produces:

- a tie for every team in every unplayed week
- "fewest points" of 0, "smallest margin" of 0, and "lowest combined" of 0
- partial scores from the week in progress counted as a final W/L

## Planned fix

1. Add `syncMatchupOutcomes()` for the current league. It only builds outcomes for weeks before the current week from `league_state`.
2. Call it at the end of `handlerSyncRegularSeasonMatchups` and `handlerSyncPostSeasonMatchups`, so the existing matchups Lambda keeps outcomes current. No infra changes needed.
3. Call it at the end of `handlerNewSeasonBootstrap`.
4. Apply the same completed-weeks filter to the current season in `buildLeagueMatchupOutcomes`, which bootstrap-history uses.
5. Fix the swapped log labels in `handlerHistoryBootstrap`. The outcomes step logs "PLAYOFFS" and the playoffs step logs "MATCHUPS".

## Cleanup

If outcomes were rebuilt while weeks were still unplayed, delete the bad rows. Change the week number to the current week:

```sql
DELETE FROM matchup_outcomes
WHERE season = '2026' AND week >= 7;
```

To check what's in the table:

```sql
SELECT season, count(*) FROM matchup_outcomes GROUP BY season ORDER BY season;
```

## Other notes

- `src/config.ts` only reads `.env` when the app starts. After editing `/opt/bbfb/.env`, run `sudo systemctl restart bbfb`.
- A curl to `localhost` goes through nginx, so a long bootstrap can return a 504 while the app keeps running. Follow progress with `sudo journalctl -u bbfb -f`.
