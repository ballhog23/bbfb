import type { LeagueUserParams } from "../../api/users.js";
import { usersTable, type InsertLeagueUser } from '../schema.js';
import { db } from '../index.js';
import { sql, eq } from "drizzle-orm";

// we will rethink the initial insertion vs future insertion later on
export async function insertLeagueUser(user: InsertLeagueUser) {

    const [result] = await db
        .insert(usersTable)
        .values(user)
        .onConflictDoUpdate({
            target: usersTable.userId,
            set: {
                displayName: sql`EXCLUDED.display_name`,
                teamName: sql`EXCLUDED.team_name`,
                avatarId: sql`EXCLUDED.avatar_id`
            }
        })
        .returning();

    return result;
}

export async function selectAllLeagueUsers() {
    return await db.select().from(usersTable);
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