import type { SelectNFLPlayer, StrictInsertNFLPlayer } from "../db/schema.js";
import { Sleeper } from "../lib/sleeper.js";
import { insertNFLPlayer } from "../db/queries/players.js";
import { strictNFLPlayerSchema, type RawNFLPlayer, NullableRawNFLPlayer, StrictNFLPLayer } from "../lib/zod.js";
import { undefinedToNullDeep, normalizeString } from "../lib/helpers.js";

export async function syncNFLPlayers() {
    const sleeper = new Sleeper();
    const players = await sleeper.getAllNFLPlayers();
    const normalizedPlayers = rawToNormalizedNFLPlayers(players);
    const result = await insertNFLPlayers(normalizedPlayers);

    return result;
}

export async function buildAndInsertNFLPlayers() {
    const players = await buildNFLPlayers();
    const result = await insertNFLPlayers(players);

    return result;
}

// perhaps look into parallel insertion with promise.allSettled()
// we could chunk and still get per player atomicity, and collect success and failures
// allSettled version took 5.50s concurrency
// sequential insertion takes 11.87s
export async function insertNFLPlayers(players: StrictInsertNFLPlayer[]) {
    const successfulPlayers: SelectNFLPlayer[] = [];
    const failedPlayers: { playerId: string, error: unknown; }[] = [];
    // const results = await Promise.allSettled(
    //     players.map(async player => await insertNFLPlayer(player))
    // );


    for (const player of players) {

        try {
            const result = await insertNFLPlayer(player);
            successfulPlayers.push(result);
        } catch (error) {
            failedPlayers.push({ playerId: player.playerId, error });
        }
    }

    if (failedPlayers.length > 0) {
        throw new AggregateError(
            failedPlayers.map(e => e.error),
            'Failed to insert players'
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