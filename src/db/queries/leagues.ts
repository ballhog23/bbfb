import { sql, eq, ne, desc } from "drizzle-orm";
import { db } from "../index.js";
import { leaguesTable, type StrictInsertLeague } from '../schema.js';

export async function insertLeague(league: StrictInsertLeague) {
    const [result] = await db
        .insert(leaguesTable)
        .values(league)
        .onConflictDoUpdate({
            target: leaguesTable.leagueId,
            set: {
                status: sql`EXCLUDED.status`,
                season: sql`EXCLUDED.season`,
                leagueName: sql`EXCLUDED.league_name`,
                avatarId: sql`EXCLUDED.avatar_id`,
                previousLeagueId: sql`EXCLUDED.previous_league_id`,
                draftId: sql`EXCLUDED.draft_id`,
                rosterPositions: sql`EXCLUDED.roster_positions`,
                totalRosters: sql`EXCLUDED.total_rosters`
            }
        })
        .returning();

    return result;
}

export async function selectAllLeagues() {
    const rows = await db
        .select()
        .from(leaguesTable)
        .orderBy(desc(leaguesTable.season));

    return rows;
}

export async function selectAllLeaguesIdsAndSeasons() {
    const rows = await db
        .select({
            leagueId: leaguesTable.leagueId,
            season: leaguesTable.season
        })
        .from(leaguesTable)
        .orderBy(desc(leaguesTable.season));

    return rows;
}

export async function selectLeague(leagueId: string) {
    const [rows] = await db
        .select()
        .from(leaguesTable)
        .where(eq(leaguesTable.leagueId, leagueId));

    return rows;
}

export async function selectCurrentLeague() {
    const [result] = await db
        .select()
        .from(leaguesTable)
        .where(ne(leaguesTable.status, 'completed'));

    return result;
}

// export async function allLeaguesDropdown() {
//     const result = await db
//         .select({
//             id: leaguesTable.leagueId,
//             season: leaguesTable.season,
//             leagueName: leaguesTable.leagueName
//         })
//         .from(leaguesTable)
//         .orderBy(leaguesTable.season);

//     return result;
// }