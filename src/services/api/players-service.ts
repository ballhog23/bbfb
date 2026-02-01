import type { SelectNFLPlayer, StrictInsertNFLPlayer } from "../../db/schema.js";
import { Sleeper } from "../../lib/sleeper.js";
import { insertNFLPlayer } from "../../db/queries/players.js";
import { strictNFLPlayerSchema, type RawNFLPlayer, NullableRawNFLPlayer, StrictNFLPLayer } from "../../lib/zod.js";
import { undefinedToNullDeep, normalizeString } from "../../lib/helpers.js";


export async function syncNFLPlayers() {
    const players = await buildNFLPlayers();
    const result = await insertNFLPlayers(players);

    return result;
}

export async function insertNFLPlayers(players: StrictInsertNFLPlayer[]) {
    const successfulPlayers: SelectNFLPlayer[] = [];
    const failedPlayers: { playerId: string, error: unknown; }[] = [];
    const CHUNK_SIZE = 100;

    for (let i = 0; i < players.length; i += CHUNK_SIZE) {
        const chunk = players.slice(i, i + CHUNK_SIZE);
        const currentInsert = chunk.map(player => insertNFLPlayer(player));
        const results = await Promise.allSettled(currentInsert);

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') successfulPlayers.push(result.value);
            else failedPlayers.push({ playerId: chunk[index].playerId, error: result.reason });
        });
    }

    if (failedPlayers.length > 0) {
        failedPlayers.forEach(player =>
            console.error(`Player ID: ${player.playerId} failed with ${player.error}`)
        );
    }

    return successfulPlayers;
}

export async function buildNFLPlayers(): Promise<StrictInsertNFLPlayer[]> {
    const sleeper = new Sleeper();
    const rawNFLPlayers = await sleeper.getAllNFLPlayers();

    return rawToNormalizedNFLPlayers(rawNFLPlayers);
}

export function normalizeNFLPlayer(rawPlayer: RawNFLPlayer) {
    const fantasyPositions = rawPlayer.fantasy_positions ?
        rawPlayer.fantasy_positions.map(position => normalizeString(position)) : null;
    const position = rawPlayer.position ? normalizeString(rawPlayer.position) : null;
    const team = rawPlayer.team ? normalizeString(rawPlayer.team) : null;
    const number = rawPlayer.number ? rawPlayer.number : null;
    const injuryStatus = rawPlayer.injury_status ? rawPlayer.injury_status : null;
    const age = rawPlayer.age ? rawPlayer.age : null;

    return {
        playerId: normalizeString(rawPlayer.player_id),
        firstName: normalizeString(rawPlayer.first_name),
        lastName: normalizeString(rawPlayer.last_name),
        active: rawPlayer.active,
        fantasyPositions,
        position,
        team,
        number,
        age,
        injuryStatus,
    } satisfies StrictNFLPLayer;
}

export function rawToNormalizedNFLPlayers(rawPlayer: RawNFLPlayer[]) {
    return rawPlayer
        .map(player => undefinedToNullDeep(player) as NullableRawNFLPlayer)
        .map(player => normalizeNFLPlayer(player))
        .map(player => strictNFLPlayerSchema.parse(player));
}