import type { LeagueUserParams } from "../../api/users.js";
import { usersTable, type StrictInsertLeagueUser } from '../schema.js';
import { db } from '../index.js';
import { sql, eq } from "drizzle-orm";

// handles initial insertion/sync
export async function insertLeagueUser(user: StrictInsertLeagueUser) {

    const [result] = await db
        .insert(usersTable)
        .values(user)
        .onConflictDoUpdate({
            target: usersTable.userId,
            set: {
                displayName: sql`EXCLUDED.display_name`,
                teamName: sql`EXCLUDED.team_name`,
                avatarId: sql`EXCLUDED.avatar_id`,
                isActive: sql`EXCLUDED.is_active`,
            }
        })
        .returning();

    return result;
}

export async function selectAllLeagueUsers() {
    return await db.select().from(usersTable);
}

export async function selectActiveLeagueUsers(): Promise<StrictInsertLeagueUser[]> {
    const result = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.isActive, true));

    return result;
}

export async function selectLeagueUser(userId: LeagueUserParams["userId"]) {
    const [result] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.userId, userId));

    return result;
}

export async function dropAllLeagueUsers() {
    await db.delete(usersTable);
}