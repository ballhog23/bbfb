import { sql, eq, and, sum, isNotNull, desc, count, lt, gte, isNull } from "drizzle-orm";
import { db } from "../index.js";
import {
    leagueUsersTable, matchupsTable,
    playoffsTable, matchupOutcomesTable,
    rostersTable,
    type StrictInsertPlayoffMatchup
} from "../schema.js";

export async function insertPlayoffMatchup(matchup: StrictInsertPlayoffMatchup) {
    const [result] = await db
        .insert(playoffsTable)
        .values(matchup)
        .onConflictDoUpdate({
            target: [
                playoffsTable.leagueId,
                playoffsTable.bracketType,
                playoffsTable.bracketMatchupId
            ],
            set: {
                matchupId: sql`EXCLUDED.matchup_id`,
                week: sql`EXCLUDED.week`,
                round: sql`EXCLUDED.round`,
                loserId: sql`EXCLUDED.loser_id`,
                winnerId: sql`EXCLUDED.winner_id`,
                place: sql`EXCLUDED.place`,
                t1: sql`EXCLUDED.t1`,
                t2: sql`EXCLUDED.t2`,
                t1FromWinner: sql`EXCLUDED.t1_from_winner`,
                t1FromLoser: sql`EXCLUDED.t1_from_loser`,
                t2FromWinner: sql`EXCLUDED.t2_from_winner`,
                t2FromLoser: sql`EXCLUDED.t2_from_loser`
            }
        })
        .returning();

    return result;
}

export async function selectAllPlayoffMatchups() {
    const result = await db
        .select()
        .from(playoffsTable);

    return result;
}

export async function selectPlayoffMatchupsPerSeason(leagueId: string) {
    const result = await db
        .select()
        .from(playoffsTable)
        .where(
            eq(playoffsTable.leagueId, leagueId)
        )
        .orderBy(
            desc(playoffsTable.bracketType),
            playoffsTable.week,
            sql`${playoffsTable.matchupId} NULLS LAST`
        );

    return result;
}

export async function selectLeagueWinner(leagueId: string) {
    const [result] = await db
        .select({
            teamName: leagueUsersTable.teamName,
            avatar: leagueUsersTable.avatarId,
        })
        .from(playoffsTable)
        .innerJoin(rostersTable,
            and(
                eq(playoffsTable.leagueId, rostersTable.leagueId),
                eq(playoffsTable.winnerId, rostersTable.rosterId)
            )
        )
        .innerJoin(leagueUsersTable,
            and(
                eq(playoffsTable.leagueId, leagueUsersTable.leagueId),
                eq(leagueUsersTable.userId, rostersTable.rosterOwnerId)
            )
        )
        .where(
            and(
                eq(playoffsTable.leagueId, leagueId),
                eq(playoffsTable.week, 17),
                eq(playoffsTable.bracketType, 'winners_bracket'),
                eq(playoffsTable.place, 1)
            )
        );

    return result;
}

export async function selectLeagueLoser(leagueId: string) {
    const [result] = await db
        .select({
            teamName: leagueUsersTable.teamName,
            avatar: leagueUsersTable.avatarId,
        })
        .from(playoffsTable)
        .innerJoin(rostersTable,
            and(
                eq(playoffsTable.leagueId, rostersTable.leagueId),
                eq(playoffsTable.loserId, rostersTable.rosterId)
            )
        )
        .innerJoin(leagueUsersTable,
            and(
                eq(playoffsTable.leagueId, leagueUsersTable.leagueId),
                eq(leagueUsersTable.userId, rostersTable.rosterOwnerId)
            )
        )
        .where(
            and(
                eq(playoffsTable.leagueId, leagueId),
                eq(playoffsTable.week, 16),
                eq(playoffsTable.bracketType, 'losers_bracket'),
                eq(playoffsTable.place, 5)
            )
        );

    return result;
}