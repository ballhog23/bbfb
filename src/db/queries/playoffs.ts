import { sql, eq, and, sum, isNotNull, desc, count, lt, gte, isNull } from "drizzle-orm";
import { db } from "../index.js";
import { leagueUsersTable, matchupsTable, playoffsTable, matchupOutcomesTable, rostersTable, type StrictInsertPlayoffMatchup } from "../schema.js";

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
        .orderBy(playoffsTable.week, playoffsTable.round, playoffsTable.bracketType);

    return result;
}