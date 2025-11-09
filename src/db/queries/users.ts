import { usersTable, type InsertLeagueUser } from '../schema.js';
import { db } from '../index.js';
import { sql } from "drizzle-orm";

export async function insertLeagueUser(user: InsertLeagueUser) {
    const result = await db
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

export async function dropAllLeagueUsers() {
    await db.delete(usersTable);
}