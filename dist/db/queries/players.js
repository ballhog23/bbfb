import { sql, eq } from "drizzle-orm";
import { db } from "../index.js";
import { NFLPlayersTable } from "../schema.js";
export async function insertNFLPlayer(players) {
    const [result] = await db
        .insert(NFLPlayersTable)
        .values(players)
        .onConflictDoUpdate({
        target: NFLPlayersTable.playerId,
        set: {
            firstName: sql `EXCLUDED.first_name`,
            lastName: sql `EXCLUDED.last_name`,
            active: sql `EXCLUDED.active`,
            fantasyPositions: sql `EXCLUDED.fantasy_positions`,
            position: sql `EXCLUDED.position`,
            team: sql `EXCLUDED.team`,
            number: sql `EXCLUDED.number`,
            age: sql `EXCLUDED.age`,
            injuryStatus: sql `EXCLUDED.injury_status`,
        },
    })
        .returning();
    return result;
}
export async function selectAllNFLPlayers() {
    const result = await db.select().from(NFLPlayersTable);
    return result;
}
export async function selectNFLPlayer(playerId) {
    const [result] = await db
        .select()
        .from(NFLPlayersTable)
        .where(eq(NFLPlayersTable.playerId, playerId));
    return result;
}
export async function dropAllNFLPlayers() {
    await db.delete(NFLPlayersTable);
}
