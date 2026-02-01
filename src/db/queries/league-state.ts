import { sql } from "drizzle-orm";
import { db } from "../index.js";
import { leagueStateTable, type StrictInsertLeagueState } from '../schema.js';

export async function insertLeagueState(leagueState: StrictInsertLeagueState) {
    const [result] = await db
        .insert(leagueStateTable)
        .values(leagueState)
        .onConflictDoUpdate({
            target: leagueStateTable.season,
            set: {
                week: sql`EXCLUDED.week`,
                leg: sql`EXCLUDED.leg`,
                seasonType: sql`EXCLUDED.season_type`,
                previousSeason: sql`EXCLUDED.previous_season`,
                displayWeek: sql`EXCLUDED.display_week`,
                isLeagueActive: sql`EXCLUDED.is_league_active`
            }
        })
        .returning();

    return result;
}

export async function selectLeagueState() {
    const [result] = await db
        .select()
        .from(leagueStateTable);

    return result;
}