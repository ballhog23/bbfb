import { sql } from "drizzle-orm";
import { db } from "../index.js";
import { InsertNFLPlayer, NFLPlayersTable, SelectNFLPlayer } from "../schema.js";
import { DrizzleQueryError } from "drizzle-orm";

export async function insertNFLPlayers(players: InsertNFLPlayer[]) {
    const chunkLength = 1000;

    try {
        for (let i = 0, j = 0; i < players.length; i += chunkLength, j++) {
            const currentChunk = players.slice(i, i + chunkLength);
            await insertNFLPlayerChunk(currentChunk);
        }
    }
    catch (e) {
        if (e instanceof DrizzleQueryError) {
            console.error("Drizzle query failed:", e.message);
            console.error("Original database error:", e.cause);
        } else {
            console.error("Unexpected error:", e);
        }
    }
}

async function insertNFLPlayerChunk(players: InsertNFLPlayer[]) {

    await db.transaction(async (tx) => {
        await tx
            .insert(NFLPlayersTable)
            .values(players)
            .onConflictDoUpdate({
                target: NFLPlayersTable.playerId,
                set: {
                    firstName: sql`EXCLUDED.first_name`,
                    lastName: sql`EXCLUDED.last_name`,
                    active: sql`EXCLUDED.active`,
                    fantasyPositions: sql`EXCLUDED.fantasy_positions`,
                    position: sql`EXCLUDED.position`,
                    team: sql`EXCLUDED.team`,
                }
            });
    });
}

export async function selectAllNFLPlayers() {
    const result = await db
        .select()
        .from(NFLPlayersTable);

    return result;
}