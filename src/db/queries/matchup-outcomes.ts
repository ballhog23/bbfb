import { sql, eq, and, sum, isNotNull, desc, } from "drizzle-orm";
import { db } from "../index.js";
import {
    matchupOutcomesTable, matchupsTable,
    rostersTable, leagueUsersTable,
    sleeperUsersTable, type StrictInsertMatchupOutcome,
} from "../schema.js";

// sleeper only accounts for total points scored as weeks 1-14 (regular season)
// we are going to account for total points scored all time, even if it was a bye week and even if it's the post season

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

export async function selectLeaguePointsScoredPerUser(leagueId: string) {
    const result = await db
        .selectDistinct({
            ownerId: sleeperUsersTable.userId,
            name: sleeperUsersTable.displayName,
            points: sum(matchupOutcomesTable.pointsFor)

        })
        .from(matchupOutcomesTable)
        .innerJoin(
            sleeperUsersTable,
            eq(sleeperUsersTable.userId, matchupOutcomesTable.rosterOwnerId)
        )
        .where(eq(matchupOutcomesTable.leagueId, leagueId))
        .groupBy(sleeperUsersTable.userId, sleeperUsersTable.displayName)
        .orderBy(desc(sum(matchupOutcomesTable.pointsFor)));

    return result;
}

export async function selectAllTimePointsScoredPerUser() {
    const result = await db
        .select({
            ownerId: sleeperUsersTable.userId,
            name: sleeperUsersTable.displayName,
            points: sum(matchupOutcomesTable.pointsFor)
        })
        .from(matchupOutcomesTable)
        .innerJoin(sleeperUsersTable, eq(sleeperUsersTable.userId, matchupOutcomesTable.rosterOwnerId))
        .groupBy(sleeperUsersTable.userId, sleeperUsersTable.displayName)
        .orderBy(desc(sum(matchupOutcomesTable.pointsFor)));

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