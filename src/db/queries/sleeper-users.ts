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

// used in rivalry page dropdowns
export async function selectAllSleeperUsersData() {
    const result = await db
        .select({
            teamName: sql<string>`
                (
                    SELECT
                        lu.team_name
                    FROM league_users lu
                    INNER JOIN rosters r ON
                        lu.user_id = r.roster_owner_id AND 
                        lu.league_id = r.league_id
                    WHERE
                        lu.user_id = sleeper_users.user_id
                    ORDER BY r.season DESC
                    LIMIT 1
                )
            `,
            teamAvatar: sql<string | null>`
                (
                    SELECT
                        lu.avatar_id
                    FROM league_users lu
                    INNER JOIN rosters r ON
                        lu.user_id = r.roster_owner_id AND 
                        lu.league_id = r.league_id
                    WHERE
                        lu.user_id = sleeper_users.user_id
                    ORDER BY r.season DESC
                    LIMIT 1
                )
            `,
            userId: sleeperUsersTable.userId,
            displayName: sleeperUsersTable.displayName,
            userAvatar: sleeperUsersTable.avatarId
        })
        .from(sleeperUsersTable);


    return result;
}

export type SleeperUserData = Awaited<ReturnType<typeof selectAllSleeperUsersData>>;


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