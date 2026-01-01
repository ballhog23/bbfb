import { sql, and, eq, desc } from "drizzle-orm";
import { db } from "../index.js";
import { matchupsTable, StrictInsertMatchup } from "../schema.js";

export async function insertMatchup(matchup: StrictInsertMatchup) {
    const [result] = await db
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