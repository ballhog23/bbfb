import type { PlayerParams } from '../../api/players.js';
import { sql, eq } from "drizzle-orm";
import { db } from "../index.js";
import { InsertNFLPlayer, NFLPlayersTable } from "../schema.js";

// we need to reevaluate the approach for inserting nfl players.
// the data set is large enough to consider batching.
// each player is the atomic unit, but we are currently treating a batch of 1k players as the atomic unit
// we will need hit the players endpoint daily to ensure data regarding players is up to date (injuries etc.)
// we will for simplicitly sake just use a simple insert/upsert.
// if performance is an issue we will look into optimizations
// e.g., batching techniques for large datasets where each row needs to be treated as atomic
export async function insertNFLPlayer(players: InsertNFLPlayer) {
    const [result] = await db
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
                number: sql`EXCLUDED.number`,
                age: sql`EXCLUDED.age`,
                injuryStatus: sql`EXCLUDED.injury_status`,
            }
        })
        .returning();

    return result;
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

export async function dropAllNFLPlayers() {
    await db.delete(NFLPlayersTable);
}