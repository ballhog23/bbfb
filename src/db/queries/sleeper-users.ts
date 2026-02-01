import { sleeperUsersTable, type StrictInsertSleeperUser } from "../schema.js";
import { db } from '../index.js';
import { sql, eq } from "drizzle-orm";

// handles initial insertion/sync
export async function insertSleeperUser(user: StrictInsertSleeperUser) {
    const [result] = await db
        .insert(sleeperUsersTable)
        .values(user)
        .onConflictDoUpdate({
            target: sleeperUsersTable.userId,
            set: {
                avatarId: sql`EXCLUDED.avatar_id`,
                userName: sql`EXCLUDED.user_name`,
                displayName: sql`EXCLUDED.display_name`,
            }
        })
        .returning();

    return result;
}

export async function selectAllSleeperUsers() {
    const result = await db
        .select()
        .from(sleeperUsersTable);

    return result;
}

export async function selectSleeperUser(userId: string) {
    const [result] = await db
        .select()
        .from(sleeperUsersTable)
        .where(eq(sleeperUsersTable.userId, userId));

    return result;
}

export async function dropAllSleeperUsers() {
    await db.delete(sleeperUsersTable);
}