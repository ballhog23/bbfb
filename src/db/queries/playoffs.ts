import { sql, eq, and, sum, isNotNull, desc, count, lt, gte, } from "drizzle-orm";
import { db } from "../index.js";
import { playoffsTable, type StrictInsertPlayoffMatchup } from "../schema.js";

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
                round: sql`EXCLUDED.round`,
                loserId: sql`EXCLUDED.loser_id`,
                winnerId: sql`EXCLUDED.winner_id`,
                place: sql`EXCLUDED.place`,
                t1: sql`EXCLUDED.t1`,
                t2: sql`EXCLUDED.t2`,
                t1From: sql`EXCLUDED.t1From`,
                t2From: sql`EXCLUDED.t2From`,
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