import type { PlayerParams } from '../../api/players.js';
import { sql, eq } from "drizzle-orm";
import { db } from "../index.js";
import { InsertNFLPlayer, NFLPlayersTable } from "../schema.js";

export async function insertNFLPlayers(players: InsertNFLPlayer[]) {
    const chunkLength = 1000;
    for (let i = 0; i < players.length; i += chunkLength) {
        const currentChunk = players.slice(i, i + chunkLength);
        await insertNFLPlayerChunk(currentChunk);
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

export async function selectNFLPlayer(playerId: PlayerParams["playerId"]) {
    const [result] = await db
        .select()
        .from(NFLPlayersTable)
        .where(eq(NFLPlayersTable.playerId, playerId));

    return result;
}