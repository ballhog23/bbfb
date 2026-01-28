import { sql, eq, and, sum, isNotNull, desc, count, lt, gte, } from "drizzle-orm";
import { db } from "../index.js";
import {
    matchupOutcomesTable, matchupsTable,
    rostersTable, leagueUsersTable,
    sleeperUsersTable, type StrictInsertMatchupOutcome,
} from "../schema.js";

// sleeper only accounts for total points scored as weeks 1-14 (regular season)
// we are going to account for total points scored all time, even if it was a bye week and even if it's the post season
// we can select regular season and post season data...
// 2025 we started using the league median, so if you score above the median of the league scores, and win the matchup
// you got 2 wins, if you won the matchup but scored less than median, you got 1W 1L

//
export async function insertMatchupOutcome(outcome: StrictInsertMatchupOutcome) {
    const result = await db
        .insert(matchupOutcomesTable)
        .values(outcome)
        .onConflictDoUpdate({
            target: [
                matchupOutcomesTable.leagueId,
                matchupOutcomesTable.rosterOwnerId,
                matchupOutcomesTable.week,
                matchupOutcomesTable.rosterId,
            ],
            set: {
                matchupId: sql`EXCLUDED.matchup_id`,
                outcome: sql`EXCLUDED.outcome`,
                season: sql`EXCLUDED.season`,
                pointsFor: sql`EXCLUDED.points_for`,
                pointsAgainst: sql`EXCLUDED.points_against`
            }
        })
        .returning();

    return result;
}

export async function selectAllLeagueMatchupOutcomes() {
    const result = await db
        .select()
        .from(matchupOutcomesTable);

    return result;
}

export async function selectLeagueSeasonMatchupOutcomes(leagueId: string) {
    const result = await db
        .select()
        .from(matchupOutcomesTable)
        .where(eq(matchupOutcomesTable.leagueId, leagueId))
        .orderBy(matchupOutcomesTable.week, matchupOutcomesTable.matchupId);

    return result;
}

export async function selectWeeklyLeagueMatchupOutcomes(leagueId: string, week: number) {
    const result = await db
        .select()
        .from(matchupOutcomesTable)
        .where(
            and(
                eq(matchupOutcomesTable.leagueId, leagueId),
                eq(matchupOutcomesTable.week, week)
            )
        );

    return result;
}

export async function selectLeaguePointsScoredPerUser(leagueId: string) {
    const result = await db
        .selectDistinct({
            userId: sleeperUsersTable.userId,
            name: sleeperUsersTable.displayName,
            points: sum(matchupOutcomesTable.pointsFor)

        })
        .from(matchupOutcomesTable)
        .innerJoin(
            sleeperUsersTable,
            eq(sleeperUsersTable.userId, matchupOutcomesTable.rosterOwnerId)
        )
        .where(
            and(
                eq(matchupOutcomesTable.leagueId, leagueId),
                lt(matchupOutcomesTable.week, 15)
            )
        )
        .groupBy(sleeperUsersTable.userId, sleeperUsersTable.displayName)
        .orderBy(desc(sum(matchupOutcomesTable.pointsFor)));

    return result;
}

export async function selectAllTimePointsScoredPerUser() {
    const result = await db
        .select({
            userId: sleeperUsersTable.userId,
            name: sleeperUsersTable.displayName,
            points: sum(matchupOutcomesTable.pointsFor)
        })
        .from(matchupOutcomesTable)
        .innerJoin(sleeperUsersTable, eq(sleeperUsersTable.userId, matchupOutcomesTable.rosterOwnerId))
        .groupBy(sleeperUsersTable.userId, sleeperUsersTable.displayName)
        .orderBy(desc(sum(matchupOutcomesTable.pointsFor)));

    return result;

}

export async function selectLeagueRegularSeasonStats(leagueId: string) {
    const pointsForExpr = sql<string>`
        COALESCE(${sum(matchupOutcomesTable.pointsFor)}, 0)
    `;
    const pointsAgainstExpr = sql<string>`
    COALESCE(${sum(matchupOutcomesTable.pointsAgainst)}, 0)
    `;
    const winsExpr = sql<number>`
        COALESCE(
            ${sum(sql<number>`
                CASE
                    WHEN matchup_outcomes.outcome = 'W' THEN 1
                    ELSE 0
                END
            `)},
            0
        )
    `;
    const lossesExpr = sql<number>`
        COALESCE(
            ${sum(sql<number>`
                CASE
                    WHEN matchup_outcomes.outcome = 'L' THEN 1
                    ELSE 0
                END
            `)},
            0
        )
    `;

    const result = await db
        .select({
            userId: sleeperUsersTable.userId,
            ownerName: sleeperUsersTable.displayName,
            teamName: leagueUsersTable.teamName,
            pointsFor: pointsForExpr,
            pointsAgainst: pointsAgainstExpr,
            wins: winsExpr,
            losses: lossesExpr,
        })
        .from(matchupOutcomesTable)
        .innerJoin(sleeperUsersTable, eq(sleeperUsersTable.userId, matchupOutcomesTable.rosterOwnerId))
        .innerJoin(leagueUsersTable, eq(leagueUsersTable.leagueId, leagueId))
        .where(
            and(
                eq(matchupOutcomesTable.leagueId, leagueId),
                eq(matchupOutcomesTable.rosterOwnerId, leagueUsersTable.userId),
                lt(matchupOutcomesTable.week, 15)
            )
        )
        .groupBy(sleeperUsersTable.userId, sleeperUsersTable.displayName, leagueUsersTable.teamName)
        .orderBy(desc(winsExpr), desc(pointsForExpr));

    return result;
}

export async function selectAllTimeWinLossRatioPerUser() {
    const result = await db
        .select({
            userId: sleeperUsersTable.userId,
            name: sleeperUsersTable.displayName,
            wins: sum(sql<number>`
                CASE
                    WHEN matchup_outcomes.outcome = 'W' THEN 1
                    ELSE 0
                END
            `),
            losses: sum(sql<number>`
                CASE
                    WHEN matchup_outcomes.outcome = 'L' THEN 1
                    ELSE 0
                END
            `),
        })
        .from(matchupOutcomesTable)
        .innerJoin(sleeperUsersTable, eq(sleeperUsersTable.userId, matchupOutcomesTable.rosterOwnerId))
        .groupBy(sleeperUsersTable.userId, sleeperUsersTable.displayName);

    return result;
}

// query to build data for insertion into matchup outcomes
export async function selectLeagueMatchupOutcomes(leagueId: string) {
    const result = await db
        .select({
            leagueId: matchupsTable.leagueId,
            matchupId: matchupsTable.matchupId,
            week: matchupsTable.week,
            rosterId: matchupsTable.rosterId,
            rosterOwnerId: rostersTable.rosterOwnerId,
            season: matchupsTable.season,
            team: leagueUsersTable.teamName,
            owner: sleeperUsersTable.displayName,
            pointsFor: matchupsTable.points,
            // matchups are stored per user per matchup, meaning two rows are inserted for every weekly matchup
            // so we can calculate the points against with a subquery that is not the rosterId we calculated for points for
            pointsAgainst: sql<string>`
                (
                    SELECT SUM(mo2.points)
                    FROM matchups mo2
                    WHERE mo2.league_id = ${matchupsTable.leagueId}
                        AND mo2.week = ${matchupsTable.week}
                        AND mo2.matchup_id = ${matchupsTable.matchupId}
                        AND mo2.roster_id != ${matchupsTable.rosterId}
                )
            `

        })
        .from(matchupsTable)
        .innerJoin(rostersTable, and(
            eq(rostersTable.leagueId, leagueId),
            eq(rostersTable.rosterId, matchupsTable.rosterId)
        ))
        .innerJoin(leagueUsersTable, and(
            eq(leagueUsersTable.leagueId, leagueId),
            eq(rostersTable.rosterOwnerId, leagueUsersTable.userId)
        ))
        .innerJoin(sleeperUsersTable, eq(leagueUsersTable.userId, sleeperUsersTable.userId))
        .where(
            eq(matchupsTable.leagueId, leagueId)
        )
        .orderBy(matchupsTable.week);

    return result;
}