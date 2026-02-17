import { sql, eq, desc, sum, count, avg, and, lt } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../index.js";
import { matchupOutcomesTable, leagueUsersTable, sleeperUsersTable, rostersTable } from "../schema.js";
const mo = matchupOutcomesTable;
const matchupOutcomes2 = alias(matchupOutcomesTable, 'mo_2');
const matchupPointsCTE = db.$with('matchup_points_cte').as(
    db
        .select({
            leagueId: matchupOutcomesTable.leagueId,
            season: matchupOutcomesTable.season,
            week: matchupOutcomesTable.week,
            matchupId: matchupOutcomesTable.matchupId,
            totalPts: sql<string>`
                ${matchupOutcomesTable.pointsFor}::numeric + ${matchupOutcomes2.pointsFor}
            `.as('total_pts'),
            t1PointsFor: sql<string>`${matchupOutcomesTable.pointsFor}`.as('t1_points_for'),
            t1RosterId: sql<number>`${matchupOutcomesTable.rosterId}`.as('t1_roster_id'),
            t1RosterOwnerId: sql<string>`${matchupOutcomesTable.rosterOwnerId}`.as('t1_roster_owner_id'),
            t1Outcome: sql<string>`${matchupOutcomesTable.outcome}`.as('t1_outcome'),
            t2PointsFor: sql<string>`${matchupOutcomes2.pointsFor}`.as('t2_points_for'),
            t2RosterId: sql<number>`${matchupOutcomes2.rosterId}`.as('t2_roster_id'),
            t2RosterOwnerId: sql<string>`${matchupOutcomes2.rosterOwnerId}`.as('t2_roster_owner_id'),
            t2Outcome: sql<string>`${matchupOutcomes2.outcome}`.as('t2_outcome'),
            margin: sql<string>`ABS(${matchupOutcomesTable.pointsFor}::numeric - ${matchupOutcomes2.pointsFor}::numeric)`.as('margin'),
        })
        .from(matchupOutcomesTable)
        .innerJoin(matchupOutcomes2,
            and(
                eq(
                    matchupOutcomesTable.leagueId, matchupOutcomes2.leagueId
                ),
                eq(
                    matchupOutcomesTable.week, matchupOutcomes2.week
                ),
                eq(
                    matchupOutcomesTable.matchupId, matchupOutcomes2.matchupId
                ),
            )
        )
        .where(
            lt(
                matchupOutcomesTable.rosterId, matchupOutcomes2.rosterId
            )
        )
);
const seasonWeekPointsScoredCTE = db.$with('season_week_points_total_cte').as(
    db
        .select({
            leagueId: matchupPointsCTE.leagueId,
            season: matchupPointsCTE.season,
            week: matchupPointsCTE.week,
            totalPts: sum(matchupPointsCTE.totalPts).as('total_pts'),
        })
        .from(matchupPointsCTE)
        .groupBy(
            matchupPointsCTE.leagueId,
            matchupPointsCTE.season,
            matchupPointsCTE.week
        )
        .orderBy(
            desc(matchupPointsCTE.season),
            matchupPointsCTE.week
        )
);
const seasonPointsScoredCTE = db.$with('season_points_total_cte').as(
    db
        .select({
            leagueId: matchupPointsCTE.leagueId,
            season: matchupPointsCTE.season,
            totalPts: sum(matchupPointsCTE.totalPts).as('total_pts'),
        })
        .from(matchupPointsCTE)
        .groupBy(
            matchupPointsCTE.leagueId,
            matchupPointsCTE.season
        )
        .orderBy(
            desc(matchupPointsCTE.season)
        )
);
const allPointsScoredCTE = db.$with('points_total_cte').as(
    db
        .select({
            totalPts: sum(matchupPointsCTE.totalPts).as('total_pts'),
            totalGames: count().as('total_games'),
            avgPts: avg(matchupPointsCTE.totalPts).as('avg_pts'),
        })
        .from(matchupPointsCTE)
);

// the big numbers - all time data
export async function selectTheBigNumbers() {
    const [result] = await db
        .with(
            matchupPointsCTE,
            seasonWeekPointsScoredCTE,
            seasonPointsScoredCTE,
            allPointsScoredCTE
        )
        .select({
            totalPts: allPointsScoredCTE.totalPts,
            totalGames: allPointsScoredCTE.totalGames,
            avgPts: allPointsScoredCTE.avgPts,
        })
        .from(allPointsScoredCTE);

    return result;
}

// scoring records - all time
// individual records query matchup_outcomes directly (already one row per team)
// combined records need matchupPointsCTE (both teams in one row for total_pts)

const lu = leagueUsersTable;
const su = sleeperUsersTable;

const mostPts = db
    .select({
        season: mo.season,
        week: mo.week,
        rosterOwnerId: mo.rosterOwnerId,
        teamName: sql<string>`COALESCE(${lu.teamName}, ${su.displayName})`.as('team_name'),
        pointsFor: mo.pointsFor
    })
    .from(mo)
    .innerJoin(lu, and(eq(mo.rosterOwnerId, lu.userId), eq(mo.leagueId, lu.leagueId)))
    .innerJoin(su, eq(mo.rosterOwnerId, su.userId))
    .orderBy(desc(mo.pointsFor))
    .limit(1)
    .as('most_pts');

const fewestPts = db
    .select({
        season: mo.season,
        week: mo.week,
        rosterOwnerId: mo.rosterOwnerId,
        teamName: sql<string>`COALESCE(${lu.teamName}, ${su.displayName})`.as('team_name'),
        pointsFor: mo.pointsFor
    })
    .from(mo)
    .innerJoin(lu, and(eq(mo.rosterOwnerId, lu.userId), eq(mo.leagueId, lu.leagueId)))
    .innerJoin(su, eq(mo.rosterOwnerId, su.userId))
    .orderBy(mo.pointsFor)
    .limit(1)
    .as('fewest_pts');

const mostPtsInLoss = db
    .select({
        season: mo.season,
        week: mo.week,
        rosterOwnerId: mo.rosterOwnerId,
        teamName: sql<string>`COALESCE(${lu.teamName}, ${su.displayName})`.as('team_name'),
        pointsFor: mo.pointsFor
    })
    .from(mo)
    .innerJoin(lu, and(eq(mo.rosterOwnerId, lu.userId), eq(mo.leagueId, lu.leagueId)))
    .innerJoin(su, eq(mo.rosterOwnerId, su.userId))
    .where(eq(mo.outcome, 'L'))
    .orderBy(desc(mo.pointsFor))
    .limit(1)
    .as('most_pts_in_loss');

const fewestPtsInWin = db
    .select({
        season: mo.season,
        week: mo.week,
        rosterOwnerId: mo.rosterOwnerId,
        teamName: sql<string>`COALESCE(${lu.teamName}, ${su.displayName})`.as('team_name'),
        pointsFor: mo.pointsFor
    })
    .from(mo)
    .innerJoin(lu, and(eq(mo.rosterOwnerId, lu.userId), eq(mo.leagueId, lu.leagueId)))
    .innerJoin(su, eq(mo.rosterOwnerId, su.userId))
    .where(eq(mo.outcome, 'W'))
    .orderBy(mo.pointsFor)
    .limit(1)
    .as('fewest_pts_in_win');

const highestCombined = db
    .select({
        season: matchupPointsCTE.season,
        week: matchupPointsCTE.week,
        matchupId: matchupPointsCTE.matchupId,
        totalPts: matchupPointsCTE.totalPts
    })
    .from(matchupPointsCTE)
    .orderBy(desc(matchupPointsCTE.totalPts))
    .limit(1)
    .as('highest_combined');

const lowestCombined = db
    .select({
        season: matchupPointsCTE.season,
        week: matchupPointsCTE.week,
        matchupId: matchupPointsCTE.matchupId,
        totalPts: matchupPointsCTE.totalPts
    })
    .from(matchupPointsCTE)
    .orderBy(matchupPointsCTE.totalPts)
    .limit(1)
    .as('lowest_combined');

export async function selectScoringRecords() {
    const [result] = await db
        .with(matchupPointsCTE)
        .select({
            mostPtsSeason: mostPts.season,
            mostPtsWeek: mostPts.week,
            mostPtsOwnerId: mostPts.rosterOwnerId,
            mostPtsTeamName: sql<string>`"most_pts"."team_name"`,
            mostPtsValue: mostPts.pointsFor,

            fewestPtsSeason: fewestPts.season,
            fewestPtsWeek: fewestPts.week,
            fewestPtsOwnerId: fewestPts.rosterOwnerId,
            fewestPtsTeamName: sql<string>`"fewest_pts"."team_name"`,
            fewestPtsValue: fewestPts.pointsFor,

            mostPtsInLossSeason: mostPtsInLoss.season,
            mostPtsInLossWeek: mostPtsInLoss.week,
            mostPtsInLossOwnerId: mostPtsInLoss.rosterOwnerId,
            mostPtsInLossTeamName: sql<string>`"most_pts_in_loss"."team_name"`,
            mostPtsInLossValue: mostPtsInLoss.pointsFor,

            fewestPtsInWinSeason: fewestPtsInWin.season,
            fewestPtsInWinWeek: fewestPtsInWin.week,
            fewestPtsInWinOwnerId: fewestPtsInWin.rosterOwnerId,
            fewestPtsInWinTeamName: sql<string>`"fewest_pts_in_win"."team_name"`,
            fewestPtsInWinValue: fewestPtsInWin.pointsFor,

            highestCombinedSeason: highestCombined.season,
            highestCombinedWeek: highestCombined.week,
            highestCombinedMatchupId: highestCombined.matchupId,
            highestCombinedValue: sql<string>`"highest_combined"."total_pts"`,

            lowestCombinedSeason: lowestCombined.season,
            lowestCombinedWeek: lowestCombined.week,
            lowestCombinedMatchupId: lowestCombined.matchupId,
            lowestCombinedValue: sql<string>`"lowest_combined"."total_pts"`,
        })
        .from(mostPts)
        .leftJoin(fewestPts, sql`true`)
        .leftJoin(mostPtsInLoss, sql`true`)
        .leftJoin(fewestPtsInWin, sql`true`)
        .leftJoin(highestCombined, sql`true`)
        .leftJoin(lowestCombined, sql`true`);

    return result;
}

// point margins - all time
// all margin subqueries use matchupPointsCTE (one row per game, both teams' data)

const largestMargin = db
    .select({
        season: matchupPointsCTE.season,
        week: matchupPointsCTE.week,
        matchupId: matchupPointsCTE.matchupId,
        leagueId: matchupPointsCTE.leagueId,
        margin: matchupPointsCTE.margin,
        t1RosterOwnerId: matchupPointsCTE.t1RosterOwnerId,
        t2RosterOwnerId: matchupPointsCTE.t2RosterOwnerId,
    })
    .from(matchupPointsCTE)
    .orderBy(desc(matchupPointsCTE.margin))
    .limit(1)
    .as('largest_margin');

const smallestMargin = db
    .select({
        season: matchupPointsCTE.season,
        week: matchupPointsCTE.week,
        matchupId: matchupPointsCTE.matchupId,
        leagueId: matchupPointsCTE.leagueId,
        margin: matchupPointsCTE.margin,
        t1RosterOwnerId: matchupPointsCTE.t1RosterOwnerId,
        t2RosterOwnerId: matchupPointsCTE.t2RosterOwnerId,
    })
    .from(matchupPointsCTE)
    .orderBy(matchupPointsCTE.margin)
    .limit(1)
    .as('smallest_margin');

const marginAggregates = db
    .select({
        gamesUnder1pt: sql<string>`
            COUNT(*) FILTER (WHERE ${matchupPointsCTE.margin}::numeric < 1)
        `.as('games_under_1pt'),
        avgMargin: sql<string>`
            ROUND(AVG(${matchupPointsCTE.margin}::numeric), 1)
        `.as('avg_margin'),
        blowoutRate: sql<string>`
            ROUND(
                COUNT(*) FILTER (WHERE ${matchupPointsCTE.margin}::numeric > 20) * 100.0
                / NULLIF(COUNT(*), 0),
            1)
        `.as('blowout_rate'),
    })
    .from(matchupPointsCTE)
    .as('margin_aggregates');

export async function selectPointMargins() {
    const [result] = await db
        .with(matchupPointsCTE)
        .select({
            largestMarginSeason: largestMargin.season,
            largestMarginWeek: largestMargin.week,
            largestMarginMatchupId: largestMargin.matchupId,
            largestMarginValue: sql<string>`"largest_margin"."margin"`,
            largestMarginT1Name: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "largest_margin"."t1_roster_owner_id"
                AND league_users.league_id = "largest_margin"."league_id"
            )`,
            largestMarginT2Name: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "largest_margin"."t2_roster_owner_id"
                AND league_users.league_id = "largest_margin"."league_id"
            )`,

            smallestMarginSeason: smallestMargin.season,
            smallestMarginWeek: smallestMargin.week,
            smallestMarginMatchupId: smallestMargin.matchupId,
            smallestMarginValue: sql<string>`"smallest_margin"."margin"`,
            smallestMarginT1Name: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "smallest_margin"."t1_roster_owner_id"
                AND league_users.league_id = "smallest_margin"."league_id"
            )`,
            smallestMarginT2Name: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "smallest_margin"."t2_roster_owner_id"
                AND league_users.league_id = "smallest_margin"."league_id"
            )`,

            gamesUnder1pt: sql<number>`"margin_aggregates"."games_under_1pt"`,
            avgMargin: sql<string>`"margin_aggregates"."avg_margin"`,
            blowoutRate: sql<string>`"margin_aggregates"."blowout_rate"`,
        })
        .from(largestMargin)
        .leftJoin(smallestMargin, sql`true`)
        .leftJoin(marginAggregates, sql`true`);

    return result;
}

// all-time leaderboard
// per-manager aggregates query matchup_outcomes directly (one row per team per game)
// most recent team name looked up via scalar subquery (COALESCE with sleeper display name)

const allTimePtsLeader = db
    .select({
        rosterOwnerId: mo.rosterOwnerId,
        totalPts: sql<string>`SUM(${mo.pointsFor}::numeric)`.as('total_pts')
    })
    .from(mo)
    .groupBy(mo.rosterOwnerId)
    .orderBy(desc(sql`SUM(${mo.pointsFor}::numeric)`))
    .limit(1)
    .as('all_time_pts_leader');

const mostAllTimeWins = db
    .select({
        rosterOwnerId: mo.rosterOwnerId,
        wins: sql<string>`COUNT(*)`.as('wins')
    })
    .from(mo)
    .where(eq(mo.outcome, 'W'))
    .groupBy(mo.rosterOwnerId)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(1)
    .as('most_all_time_wins');

const mostAllTimeLosses = db
    .select({
        rosterOwnerId: mo.rosterOwnerId,
        losses: sql<string>`COUNT(*)`.as('losses')
    })
    .from(mo)
    .where(eq(mo.outcome, 'L'))
    .groupBy(mo.rosterOwnerId)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(1)
    .as('most_all_time_losses');

const weeklyRanksDesc = db
    .select({
        rosterOwnerId: mo.rosterOwnerId,
        rnk: sql<number>`RANK() OVER (PARTITION BY ${mo.leagueId}, ${mo.week} ORDER BY ${mo.pointsFor} DESC)`.as('rnk')
    })
    .from(mo)
    .as('weekly_ranks_desc');

const mostWeeklyTopScores = db
    .select({
        rosterOwnerId: weeklyRanksDesc.rosterOwnerId,
        topScoreCount: sql<string>`COUNT(*)`.as('top_score_count')
    })
    .from(weeklyRanksDesc)
    .where(sql`"weekly_ranks_desc"."rnk" = 1`)
    .groupBy(weeklyRanksDesc.rosterOwnerId)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(1)
    .as('most_weekly_top_scores');

export async function selectLeaderboard() {
    const [result] = await db
        .select({
            ptsLeaderOwnerId: allTimePtsLeader.rosterOwnerId,
            ptsLeaderName: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN leagues ON league_users.league_id = leagues.league_id
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "all_time_pts_leader"."roster_owner_id"
                ORDER BY leagues.season DESC
                LIMIT 1
            )`,
            ptsLeaderValue: sql<string>`"all_time_pts_leader"."total_pts"`,

            mostWinsOwnerId: mostAllTimeWins.rosterOwnerId,
            mostWinsName: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN leagues ON league_users.league_id = leagues.league_id
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "most_all_time_wins"."roster_owner_id"
                ORDER BY leagues.season DESC
                LIMIT 1
            )`,
            mostWinsValue: sql<string>`"most_all_time_wins"."wins"`,

            mostLossesOwnerId: mostAllTimeLosses.rosterOwnerId,
            mostLossesName: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN leagues ON league_users.league_id = leagues.league_id
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "most_all_time_losses"."roster_owner_id"
                ORDER BY leagues.season DESC
                LIMIT 1
            )`,
            mostLossesValue: sql<string>`"most_all_time_losses"."losses"`,

            mostTopScoresOwnerId: mostWeeklyTopScores.rosterOwnerId,
            mostTopScoresName: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN leagues ON league_users.league_id = leagues.league_id
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "most_weekly_top_scores"."roster_owner_id"
                ORDER BY leagues.season DESC
                LIMIT 1
            )`,
            mostTopScoresValue: sql<string>`"most_weekly_top_scores"."top_score_count"`,
        })
        .from(allTimePtsLeader)
        .leftJoin(mostAllTimeWins, sql`true`)
        .leftJoin(mostAllTimeLosses, sql`true`)
        .leftJoin(mostWeeklyTopScores, sql`true`);

    return result;
}

// streaks - all time
// each roster has a `record` string like "WLLWWWLW" for one season
// use regexp_matches to find longest consecutive run of W or L

const r = rostersTable;

const longestWinStreak = db
    .select({
        rosterOwnerId: r.rosterOwnerId,
        leagueId: r.leagueId,
        season: r.season,
        streakLength: sql<string>`(
            SELECT MAX(LENGTH(m[1]))
            FROM regexp_matches(${r.record}, 'W+', 'g') m
        )`.as('streak_length')
    })
    .from(r)
    .where(sql`${r.record} IS NOT NULL AND ${r.record} != ''`)
    .orderBy(desc(sql`(
        SELECT MAX(LENGTH(m[1]))
        FROM regexp_matches(${r.record}, 'W+', 'g') m
    )`))
    .limit(1)
    .as('longest_win_streak');

const longestLossStreak = db
    .select({
        rosterOwnerId: r.rosterOwnerId,
        leagueId: r.leagueId,
        season: r.season,
        streakLength: sql<string>`(
            SELECT MAX(LENGTH(m[1]))
            FROM regexp_matches(${r.record}, 'L+', 'g') m
        )`.as('streak_length')
    })
    .from(r)
    .where(sql`${r.record} IS NOT NULL AND ${r.record} != ''`)
    .orderBy(desc(sql`(
        SELECT MAX(LENGTH(m[1]))
        FROM regexp_matches(${r.record}, 'L+', 'g') m
    )`))
    .limit(1)
    .as('longest_loss_streak');

export async function selectStreaks() {
    const [result] = await db
        .select({
            winStreakOwnerId: longestWinStreak.rosterOwnerId,
            winStreakSeason: longestWinStreak.season,
            winStreakLength: sql<string>`"longest_win_streak"."streak_length"`,
            winStreakTeamName: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "longest_win_streak"."roster_owner_id"
                AND league_users.league_id = "longest_win_streak"."league_id"
            )`,

            lossStreakOwnerId: longestLossStreak.rosterOwnerId,
            lossStreakSeason: longestLossStreak.season,
            lossStreakLength: sql<string>`"longest_loss_streak"."streak_length"`,
            lossStreakTeamName: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "longest_loss_streak"."roster_owner_id"
                AND league_users.league_id = "longest_loss_streak"."league_id"
            )`,
        })
        .from(longestWinStreak)
        .leftJoin(longestLossStreak, sql`true`);

    return result;
}

// that's gotta hurt - all time
// most points faced: per-manager aggregate from matchupOutcomesTable (pointsAgainst column)
// most weekly top/last scores: rank each week's scores, count rank=1 per manager

const mostPointsFaced = db
    .select({
        rosterOwnerId: mo.rosterOwnerId,
        totalPointsFaced: sql<string>`SUM(${mo.pointsAgainst}::numeric)`.as('total_points_faced')
    })
    .from(mo)
    .where(sql`${mo.pointsAgainst} IS NOT NULL`)
    .groupBy(mo.rosterOwnerId)
    .orderBy(desc(sql`SUM(${mo.pointsAgainst}::numeric)`))
    .limit(1)
    .as('most_points_faced');

const weeklyRanksAsc = db
    .select({
        rosterOwnerId: mo.rosterOwnerId,
        rnk: sql<number>`RANK() OVER (PARTITION BY ${mo.leagueId}, ${mo.week} ORDER BY ${mo.pointsFor} ASC)`.as('rnk')
    })
    .from(mo)
    .as('weekly_ranks_asc');

const mostWeeklyLastPlaces = db
    .select({
        rosterOwnerId: weeklyRanksAsc.rosterOwnerId,
        lastPlaceCount: sql<string>`COUNT(*)`.as('last_place_count')
    })
    .from(weeklyRanksAsc)
    .where(sql`"weekly_ranks_asc"."rnk" = 1`)
    .groupBy(weeklyRanksAsc.rosterOwnerId)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(1)
    .as('most_weekly_last_places');

export async function selectThatsGottaHurt() {
    const [result] = await db
        .select({
            mostPointsFacedOwnerId: mostPointsFaced.rosterOwnerId,
            mostPointsFacedName: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN leagues ON league_users.league_id = leagues.league_id
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "most_points_faced"."roster_owner_id"
                ORDER BY leagues.season DESC
                LIMIT 1
            )`,
            mostPointsFacedValue: sql<string>`"most_points_faced"."total_points_faced"`,

            mostLastPlacesOwnerId: mostWeeklyLastPlaces.rosterOwnerId,
            mostLastPlacesName: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN leagues ON league_users.league_id = leagues.league_id
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "most_weekly_last_places"."roster_owner_id"
                ORDER BY leagues.season DESC
                LIMIT 1
            )`,
            mostLastPlacesValue: sql<string>`"most_weekly_last_places"."last_place_count"`,
        })
        .from(mostPointsFaced)
        .leftJoin(mostWeeklyLastPlaces, sql`true`);

    return result;
}

// ── Season-scoped queries ──

function buildSeasonCTE(leagueId: string) {
    return db.$with('matchup_points_cte').as(
        db
            .select({
                leagueId: mo.leagueId,
                season: mo.season,
                week: mo.week,
                matchupId: mo.matchupId,
                totalPts: sql<string>`${mo.pointsFor}::numeric + ${matchupOutcomes2.pointsFor}`.as('total_pts'),
                t1PointsFor: sql<string>`${mo.pointsFor}`.as('t1_points_for'),
                t1RosterId: sql<number>`${mo.rosterId}`.as('t1_roster_id'),
                t1RosterOwnerId: sql<string>`${mo.rosterOwnerId}`.as('t1_roster_owner_id'),
                t1Outcome: sql<string>`${mo.outcome}`.as('t1_outcome'),
                t2PointsFor: sql<string>`${matchupOutcomes2.pointsFor}`.as('t2_points_for'),
                t2RosterId: sql<number>`${matchupOutcomes2.rosterId}`.as('t2_roster_id'),
                t2RosterOwnerId: sql<string>`${matchupOutcomes2.rosterOwnerId}`.as('t2_roster_owner_id'),
                t2Outcome: sql<string>`${matchupOutcomes2.outcome}`.as('t2_outcome'),
                margin: sql<string>`ABS(${mo.pointsFor}::numeric - ${matchupOutcomes2.pointsFor}::numeric)`.as('margin'),
            })
            .from(mo)
            .innerJoin(matchupOutcomes2, and(
                eq(mo.leagueId, matchupOutcomes2.leagueId),
                eq(mo.week, matchupOutcomes2.week),
                eq(mo.matchupId, matchupOutcomes2.matchupId),
            ))
            .where(and(
                lt(mo.rosterId, matchupOutcomes2.rosterId),
                eq(mo.leagueId, leagueId),
            ))
    );
}

export async function selectSeasonBigNumbers(leagueId: string) {
    const cte = buildSeasonCTE(leagueId);
    const [result] = await db
        .with(cte)
        .select({
            totalPts: sql<string>`SUM(${cte.totalPts}::numeric)`,
            totalGames: sql<string>`COUNT(*)`,
            avgPts: sql<string>`ROUND(AVG(${cte.totalPts}::numeric), 1)`,
        })
        .from(cte);
    return result;
}

export async function selectSeasonScoringRecords(leagueId: string) {
    const cte = buildSeasonCTE(leagueId);

    const sMostPts = db.select({
        season: mo.season, week: mo.week, rosterOwnerId: mo.rosterOwnerId,
        teamName: sql<string>`COALESCE(${lu.teamName}, ${su.displayName})`.as('team_name'),
        pointsFor: mo.pointsFor,
    }).from(mo)
        .innerJoin(lu, and(eq(mo.rosterOwnerId, lu.userId), eq(mo.leagueId, lu.leagueId)))
        .innerJoin(su, eq(mo.rosterOwnerId, su.userId))
        .where(eq(mo.leagueId, leagueId))
        .orderBy(desc(mo.pointsFor)).limit(1).as('most_pts');

    const sFewestPts = db.select({
        season: mo.season, week: mo.week, rosterOwnerId: mo.rosterOwnerId,
        teamName: sql<string>`COALESCE(${lu.teamName}, ${su.displayName})`.as('team_name'),
        pointsFor: mo.pointsFor,
    }).from(mo)
        .innerJoin(lu, and(eq(mo.rosterOwnerId, lu.userId), eq(mo.leagueId, lu.leagueId)))
        .innerJoin(su, eq(mo.rosterOwnerId, su.userId))
        .where(eq(mo.leagueId, leagueId))
        .orderBy(mo.pointsFor).limit(1).as('fewest_pts');

    const sMostPtsInLoss = db.select({
        season: mo.season, week: mo.week, rosterOwnerId: mo.rosterOwnerId,
        teamName: sql<string>`COALESCE(${lu.teamName}, ${su.displayName})`.as('team_name'),
        pointsFor: mo.pointsFor,
    }).from(mo)
        .innerJoin(lu, and(eq(mo.rosterOwnerId, lu.userId), eq(mo.leagueId, lu.leagueId)))
        .innerJoin(su, eq(mo.rosterOwnerId, su.userId))
        .where(and(eq(mo.leagueId, leagueId), eq(mo.outcome, 'L')))
        .orderBy(desc(mo.pointsFor)).limit(1).as('most_pts_in_loss');

    const sFewestPtsInWin = db.select({
        season: mo.season, week: mo.week, rosterOwnerId: mo.rosterOwnerId,
        teamName: sql<string>`COALESCE(${lu.teamName}, ${su.displayName})`.as('team_name'),
        pointsFor: mo.pointsFor,
    }).from(mo)
        .innerJoin(lu, and(eq(mo.rosterOwnerId, lu.userId), eq(mo.leagueId, lu.leagueId)))
        .innerJoin(su, eq(mo.rosterOwnerId, su.userId))
        .where(and(eq(mo.leagueId, leagueId), eq(mo.outcome, 'W')))
        .orderBy(mo.pointsFor).limit(1).as('fewest_pts_in_win');

    const sHighestCombined = db.select({
        season: cte.season, week: cte.week, matchupId: cte.matchupId, totalPts: cte.totalPts,
    }).from(cte).orderBy(desc(cte.totalPts)).limit(1).as('highest_combined');

    const sLowestCombined = db.select({
        season: cte.season, week: cte.week, matchupId: cte.matchupId, totalPts: cte.totalPts,
    }).from(cte).orderBy(cte.totalPts).limit(1).as('lowest_combined');

    const [result] = await db
        .with(cte)
        .select({
            mostPtsSeason: sMostPts.season,
            mostPtsWeek: sMostPts.week,
            mostPtsTeamName: sql<string>`"most_pts"."team_name"`,
            mostPtsValue: sMostPts.pointsFor,

            fewestPtsSeason: sFewestPts.season,
            fewestPtsWeek: sFewestPts.week,
            fewestPtsTeamName: sql<string>`"fewest_pts"."team_name"`,
            fewestPtsValue: sFewestPts.pointsFor,

            mostPtsInLossSeason: sMostPtsInLoss.season,
            mostPtsInLossWeek: sMostPtsInLoss.week,
            mostPtsInLossTeamName: sql<string>`"most_pts_in_loss"."team_name"`,
            mostPtsInLossValue: sMostPtsInLoss.pointsFor,

            fewestPtsInWinSeason: sFewestPtsInWin.season,
            fewestPtsInWinWeek: sFewestPtsInWin.week,
            fewestPtsInWinTeamName: sql<string>`"fewest_pts_in_win"."team_name"`,
            fewestPtsInWinValue: sFewestPtsInWin.pointsFor,

            highestCombinedSeason: sHighestCombined.season,
            highestCombinedWeek: sHighestCombined.week,
            highestCombinedValue: sql<string>`"highest_combined"."total_pts"`,

            lowestCombinedSeason: sLowestCombined.season,
            lowestCombinedWeek: sLowestCombined.week,
            lowestCombinedValue: sql<string>`"lowest_combined"."total_pts"`,
        })
        .from(sMostPts)
        .leftJoin(sFewestPts, sql`true`)
        .leftJoin(sMostPtsInLoss, sql`true`)
        .leftJoin(sFewestPtsInWin, sql`true`)
        .leftJoin(sHighestCombined, sql`true`)
        .leftJoin(sLowestCombined, sql`true`);

    return result;
}

export async function selectSeasonPointMargins(leagueId: string) {
    const cte = buildSeasonCTE(leagueId);

    const sLargestMargin = db.select({
        season: cte.season, week: cte.week, matchupId: cte.matchupId,
        leagueId: cte.leagueId, margin: cte.margin,
        t1RosterOwnerId: cte.t1RosterOwnerId, t2RosterOwnerId: cte.t2RosterOwnerId,
    }).from(cte).orderBy(desc(cte.margin)).limit(1).as('largest_margin');

    const sSmallestMargin = db.select({
        season: cte.season, week: cte.week, matchupId: cte.matchupId,
        leagueId: cte.leagueId, margin: cte.margin,
        t1RosterOwnerId: cte.t1RosterOwnerId, t2RosterOwnerId: cte.t2RosterOwnerId,
    }).from(cte).orderBy(cte.margin).limit(1).as('smallest_margin');

    const sMarginAggregates = db.select({
        gamesUnder1pt: sql<string>`COUNT(*) FILTER (WHERE ${cte.margin}::numeric < 1)`.as('games_under_1pt'),
        avgMargin: sql<string>`ROUND(AVG(${cte.margin}::numeric), 1)`.as('avg_margin'),
        blowoutRate: sql<string>`ROUND(COUNT(*) FILTER (WHERE ${cte.margin}::numeric > 20) * 100.0 / NULLIF(COUNT(*), 0), 1)`.as('blowout_rate'),
    }).from(cte).as('margin_aggregates');

    const [result] = await db
        .with(cte)
        .select({
            largestMarginSeason: sLargestMargin.season,
            largestMarginWeek: sLargestMargin.week,
            largestMarginValue: sql<string>`"largest_margin"."margin"`,
            largestMarginT1Name: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "largest_margin"."t1_roster_owner_id"
                AND league_users.league_id = ${leagueId}
            )`,
            largestMarginT2Name: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "largest_margin"."t2_roster_owner_id"
                AND league_users.league_id = ${leagueId}
            )`,

            smallestMarginSeason: sSmallestMargin.season,
            smallestMarginWeek: sSmallestMargin.week,
            smallestMarginValue: sql<string>`"smallest_margin"."margin"`,
            smallestMarginT1Name: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "smallest_margin"."t1_roster_owner_id"
                AND league_users.league_id = ${leagueId}
            )`,
            smallestMarginT2Name: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "smallest_margin"."t2_roster_owner_id"
                AND league_users.league_id = ${leagueId}
            )`,

            gamesUnder1pt: sql<number>`"margin_aggregates"."games_under_1pt"`,
            avgMargin: sql<string>`"margin_aggregates"."avg_margin"`,
            blowoutRate: sql<string>`"margin_aggregates"."blowout_rate"`,
        })
        .from(sLargestMargin)
        .leftJoin(sSmallestMargin, sql`true`)
        .leftJoin(sMarginAggregates, sql`true`);

    return result;
}

export async function selectSeasonStreaks(leagueId: string) {
    const sWinStreak = db.select({
        rosterOwnerId: r.rosterOwnerId, leagueId: r.leagueId, season: r.season,
        streakLength: sql<string>`(SELECT MAX(LENGTH(m[1])) FROM regexp_matches(${r.record}, 'W+', 'g') m)`.as('streak_length'),
    }).from(r)
        .where(and(eq(r.leagueId, leagueId), sql`${r.record} IS NOT NULL AND ${r.record} != ''`))
        .orderBy(desc(sql`(SELECT MAX(LENGTH(m[1])) FROM regexp_matches(${r.record}, 'W+', 'g') m)`))
        .limit(1).as('longest_win_streak');

    const sLossStreak = db.select({
        rosterOwnerId: r.rosterOwnerId, leagueId: r.leagueId, season: r.season,
        streakLength: sql<string>`(SELECT MAX(LENGTH(m[1])) FROM regexp_matches(${r.record}, 'L+', 'g') m)`.as('streak_length'),
    }).from(r)
        .where(and(eq(r.leagueId, leagueId), sql`${r.record} IS NOT NULL AND ${r.record} != ''`))
        .orderBy(desc(sql`(SELECT MAX(LENGTH(m[1])) FROM regexp_matches(${r.record}, 'L+', 'g') m)`))
        .limit(1).as('longest_loss_streak');

    const [result] = await db
        .select({
            winStreakSeason: sWinStreak.season,
            winStreakLength: sql<string>`"longest_win_streak"."streak_length"`,
            winStreakTeamName: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "longest_win_streak"."roster_owner_id"
                AND league_users.league_id = ${leagueId}
            )`,

            lossStreakSeason: sLossStreak.season,
            lossStreakLength: sql<string>`"longest_loss_streak"."streak_length"`,
            lossStreakTeamName: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "longest_loss_streak"."roster_owner_id"
                AND league_users.league_id = ${leagueId}
            )`,
        })
        .from(sWinStreak)
        .leftJoin(sLossStreak, sql`true`);

    return result;
}

export async function selectSeasonLeaderboard(leagueId: string) {
    const sPtsLeader = db.select({
        rosterOwnerId: mo.rosterOwnerId,
        totalPts: sql<string>`SUM(${mo.pointsFor}::numeric)`.as('total_pts'),
    }).from(mo).where(eq(mo.leagueId, leagueId))
        .groupBy(mo.rosterOwnerId)
        .orderBy(desc(sql`SUM(${mo.pointsFor}::numeric)`))
        .limit(1).as('season_pts_leader');

    const sMostWins = db.select({
        rosterOwnerId: mo.rosterOwnerId,
        wins: sql<string>`COUNT(*)`.as('wins'),
    }).from(mo).where(and(eq(mo.leagueId, leagueId), eq(mo.outcome, 'W')))
        .groupBy(mo.rosterOwnerId)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(1).as('season_most_wins');

    const sMostLosses = db.select({
        rosterOwnerId: mo.rosterOwnerId,
        losses: sql<string>`COUNT(*)`.as('losses'),
    }).from(mo).where(and(eq(mo.leagueId, leagueId), eq(mo.outcome, 'L')))
        .groupBy(mo.rosterOwnerId)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(1).as('season_most_losses');

    const [result] = await db
        .select({
            ptsLeaderName: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "season_pts_leader"."roster_owner_id"
                AND league_users.league_id = ${leagueId}
            )`,
            ptsLeaderValue: sql<string>`"season_pts_leader"."total_pts"`,

            mostWinsName: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "season_most_wins"."roster_owner_id"
                AND league_users.league_id = ${leagueId}
            )`,
            mostWinsValue: sql<string>`"season_most_wins"."wins"`,

            mostLossesName: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "season_most_losses"."roster_owner_id"
                AND league_users.league_id = ${leagueId}
            )`,
            mostLossesValue: sql<string>`"season_most_losses"."losses"`,
        })
        .from(sPtsLeader)
        .leftJoin(sMostWins, sql`true`)
        .leftJoin(sMostLosses, sql`true`);

    return result;
}

export async function selectSeasonThatsGottaHurt(leagueId: string) {
    const sMostPointsFaced = db.select({
        rosterOwnerId: mo.rosterOwnerId,
        totalPointsFaced: sql<string>`SUM(${mo.pointsAgainst}::numeric)`.as('total_points_faced'),
    }).from(mo)
        .where(and(eq(mo.leagueId, leagueId), sql`${mo.pointsAgainst} IS NOT NULL`))
        .groupBy(mo.rosterOwnerId)
        .orderBy(desc(sql`SUM(${mo.pointsAgainst}::numeric)`))
        .limit(1).as('most_points_faced');

    const sWeeklyRanksDesc = db.select({
        rosterOwnerId: mo.rosterOwnerId,
        rnk: sql<number>`RANK() OVER (PARTITION BY ${mo.week} ORDER BY ${mo.pointsFor} DESC)`.as('rnk'),
    }).from(mo).where(eq(mo.leagueId, leagueId)).as('weekly_ranks_desc');

    const sMostTopScores = db.select({
        rosterOwnerId: sWeeklyRanksDesc.rosterOwnerId,
        topScoreCount: sql<string>`COUNT(*)`.as('top_score_count'),
    }).from(sWeeklyRanksDesc)
        .where(sql`"weekly_ranks_desc"."rnk" = 1`)
        .groupBy(sWeeklyRanksDesc.rosterOwnerId)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(1).as('most_weekly_top_scores');

    const sWeeklyRanksAsc = db.select({
        rosterOwnerId: mo.rosterOwnerId,
        rnk: sql<number>`RANK() OVER (PARTITION BY ${mo.week} ORDER BY ${mo.pointsFor} ASC)`.as('rnk'),
    }).from(mo).where(eq(mo.leagueId, leagueId)).as('weekly_ranks_asc');

    const sMostLastPlaces = db.select({
        rosterOwnerId: sWeeklyRanksAsc.rosterOwnerId,
        lastPlaceCount: sql<string>`COUNT(*)`.as('last_place_count'),
    }).from(sWeeklyRanksAsc)
        .where(sql`"weekly_ranks_asc"."rnk" = 1`)
        .groupBy(sWeeklyRanksAsc.rosterOwnerId)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(1).as('most_weekly_last_places');

    const [result] = await db
        .select({
            mostPointsFacedName: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "most_points_faced"."roster_owner_id"
                AND league_users.league_id = ${leagueId}
            )`,
            mostPointsFacedValue: sql<string>`"most_points_faced"."total_points_faced"`,

            mostTopScoresName: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "most_weekly_top_scores"."roster_owner_id"
                AND league_users.league_id = ${leagueId}
            )`,
            mostTopScoresValue: sql<string>`"most_weekly_top_scores"."top_score_count"`,

            mostLastPlacesName: sql<string>`(
                SELECT COALESCE(league_users.team_name, sleeper_users.display_name)
                FROM league_users
                INNER JOIN sleeper_users ON league_users.user_id = sleeper_users.user_id
                WHERE league_users.user_id = "most_weekly_last_places"."roster_owner_id"
                AND league_users.league_id = ${leagueId}
            )`,
            mostLastPlacesValue: sql<string>`"most_weekly_last_places"."last_place_count"`,
        })
        .from(sMostPointsFaced)
        .leftJoin(sMostTopScores, sql`true`)
        .leftJoin(sMostLastPlaces, sql`true`);

    return result;
}