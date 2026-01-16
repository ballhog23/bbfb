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
                leagueSeason: sql`EXCLUDED.league_season`,
                previousSeason: sql`EXCLUDED.previous_season`,
                seasonStartDate: sql`EXCLUDED.season_start_date`,
                displayWeek: sql`EXCLUDED.display_week`,
                leagueCreateSeason: sql`EXCLUDED.league_create_season`,
                seasonHasScores: sql`EXCLUDED.season_has_scores`,
                isLeagueActive: sql`EXCLUDED.is_league_active`
            }
        })
        .returning();

    return result;
}
