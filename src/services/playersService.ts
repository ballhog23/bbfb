import type { InsertNFLPlayer } from "../db/schema.js";
import { Sleeper } from "../lib/sleeper.js";
import { undefinedToNullDeep, normalizeString } from "../lib/helpers.js";

export async function buildAllNFLPlayers() {
    const sleeper = new Sleeper();
    const rawNFLPlayers = await sleeper.getAllNFLPlayers();
    const strictAllPlayers = undefinedToNullDeep(rawNFLPlayers);
    return strictAllPlayers.map(player => {
        const fantasyPositions = player.fantasy_positions ?
            player.fantasy_positions.map(position => normalizeString(position)) : null;
        return {
            playerId: normalizeString(player.player_id),
            firstName: normalizeString(player.first_name),
            lastName: normalizeString(player.last_name),
            active: player.active,
            position: player.position ? normalizeString(player.position) : null,
            team: player.team ? normalizeString(player.team) : null,
            fantasyPositions: fantasyPositions,
        } satisfies InsertNFLPlayer;
    });
}
