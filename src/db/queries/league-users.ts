import { leagueUsersTable, type StrictInsertLeagueUser } from '../schema.js';
import { db, } from '../index.js';
import { sql, eq, and } from "drizzle-orm";

// handles initial insertion/sync
export async function insertLeagueUser(user: StrictInsertLeagueUser) {
    const [result] = await db
        .insert(leagueUsersTable)
        .values(user)
        .onConflictDoUpdate({
            target: [leagueUsersTable.userId, leagueUsersTable.leagueId],
            set: {
                avatarId: sql`EXCLUDED.avatar_id`,
                teamName: sql`EXCLUDED.team_name`,
                isOwner: sql`EXCLUDED.is_owner`
            }
        })
        .returning();

    return result;
}

export async function selectAllLeagueUsers() {
    return await db.select().from(leagueUsersTable);
}

export async function selectLeagueUsers(leagueId: string) {
    const result = await db
        .select()
        .from(leagueUsersTable)
        .where(eq(leagueUsersTable.leagueId, leagueId));

    return result;
}

export async function selectLeagueUser(userId: string, leagueId: string) {
    const [result] = await db
        .select()
        .from(leagueUsersTable)
        .where(
            and(
                eq(leagueUsersTable.userId, userId),
                eq(leagueUsersTable.leagueId, leagueId)
            )
        );

    return result;
}