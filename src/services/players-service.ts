import type { StrictInsertNFLPlayer } from "../db/schema.js";
import { Sleeper } from "../lib/sleeper.js";
import { strictNFLPlayerSchema, type RawNFLPlayer, NullableRawNFLPlayer, StrictNFLPLayer } from "../lib/zod.js";
import { undefinedToNullDeep, normalizeString } from "../lib/helpers.js";

export async function buildAllNFLPlayers(): Promise<StrictInsertNFLPlayer[]> {
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
    const nullableNFLPlayers = rawPlayer.map(
        player => undefinedToNullDeep(player) as NullableRawNFLPlayer
    );
    const normalizedNFLPlayers = nullableNFLPlayers.map(
        player => normalizeNFLPlayer(player)
    );

    return normalizedNFLPlayers.map(player => strictNFLPlayerSchema.parse(player));
}

// syncing players is the same as initial insertion aka buildAllNFLPlayers
// check route handlers for the sync function