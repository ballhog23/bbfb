import { sql, eq } from "drizzle-orm";
import { db } from "../index.js";
import { rostersTable, type StrictInsertRoster } from '../schema.js';

// in the future we need to just insert a single leagues season roster, not all current and historical rosters
// for now we will treat all rosters as the atomic unit on insertion (this should not result in any constraint failures)
// we will want to treat the single roster as the atomic unit
// we should also look into writing a postgres trigger for if a rosters ownerId is changed
export async function insertLeagueRoster(leagueRosters: StrictInsertRoster) {
    const result = await db
        .insert(rostersTable)
        .values(leagueRosters)
        .onConflictDoUpdate({
            target: [rostersTable.leagueId, rostersTable.rosterId],
            set: {
                ownerId: sql`EXCLUDED.owner_id`,
                season: sql`EXCLUDED.season`,
                starters: sql`EXCLUDED.starters`,
                wins: sql`EXCLUDED.wins`,
                ties: sql`EXCLUDED.ties`,
                losses: sql`EXCLUDED.losses`,
                fptsAgainst: sql`EXCLUDED.fpts_against`,
                fpts: sql`EXCLUDED.fpts`,
                reserve: sql`EXCLUDED.reserve`,
                players: sql`EXCLUDED.players`,
                streak: sql`EXCLUDED.streak`,
                record: sql`EXCLUDED.record`,
            }
        })
        .returning();

    return result;
}

export async function selectAllRosters() {
    const result = await db
        .select()
        .from(rostersTable);

    return result;
}

// composite key lookup
export async function selectRoster(rosterId: string) {
    // const result = await db
    //     .select()
    //     .from(rostersTable)
    //     .where(eq(rostersTable.rosterId, rosterId));

    // return result;
}

export async function dropAllLeagueRosters() {
    await db.delete(rostersTable);
}