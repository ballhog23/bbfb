import { sql, eq } from "drizzle-orm";
import { db } from "../index.js";
import { leaguesTable, SelectLeague, type InsertLeague } from '../schema.js';

export async function insertLeague(league: InsertLeague[]) {
    const result = await db
        .insert(leaguesTable)
        .values(league)
        .onConflictDoUpdate({
            target: leaguesTable.leagueId,
            set: {
                status: sql`EXCLUDED.status`,
                previousLeagueId: sql`EXCLUDED.previous_league_id`,
                leagueName: sql`EXCLUDED.league_name`,
                avatarId: sql`EXCLUDED.avatar_id`,
                rosterPositions: sql`EXCLUDED.roster_positions`,
                totalRosters: sql`EXCLUDED.total_rosters`
            }
        })
        .returning();

    return result;
}

export async function selectAllLeagues(): Promise<SelectLeague[]> {
    const rows = await db
        .select()
        .from(leaguesTable);

    return rows;
}

export async function selectLeague(leagueId: string): Promise<SelectLeague[]> {
    const rows = await db
        .select()
        .from(leaguesTable)
        .where(eq(leaguesTable.leagueId, leagueId));

    return rows;
}