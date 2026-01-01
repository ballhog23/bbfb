import { sql, and, eq, desc } from "drizzle-orm";
import { db, type TX } from "../index.js";
import { matchupsTable, StrictInsertMatchup } from "../schema.js";

export async function insertMatchup(matchup: StrictInsertMatchup, tx?: TX) {
    const conn = tx ?? db;
    const [result] = await conn
        .insert(matchupsTable)
        .values(matchup)
        .onConflictDoUpdate({
            target: [
                matchupsTable.leagueId,
                matchupsTable.rosterId,
                matchupsTable.week
            ],
            set: {
                leagueId: sql`EXCLUDED.league_id`,
                season: sql`EXCLUDED.season`,
                week: sql`EXCLUDED.week`,
                points: sql`EXCLUDED.points`,
                players: sql`EXCLUDED.players`,
                rosterId: sql`EXCLUDED.roster_id`,
                matchupId: sql`EXCLUDED.matchup_id`,
                starters: sql`EXCLUDED.starters`,
                startersPoints: sql`EXCLUDED.starters_points`,
                playersPoints: sql`EXCLUDED.players_points`,
            }
        })
        .returning();

    return result;
}