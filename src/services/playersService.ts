import type { InsertNFLPlayer } from "../db/schema.js";
import { Sleeper } from "../lib/sleeper.js";
import { nullableRawNFLPlayerSchema } from "../lib/zod.js";
import { undefinedToNullDeep, normalizeString } from "../lib/helpers.js";

export async function buildAllNFLPlayers() {
    const sleeper = new Sleeper();
    const rawNFLPlayers = await sleeper.getAllNFLPlayers();
    const nullableAllPlayers = undefinedToNullDeep(rawNFLPlayers);
    console.log(nullableAllPlayers);
    const strictAllPlayers = nullableAllPlayers.map(player => nullableRawNFLPlayerSchema.parse(player));

    return strictAllPlayers.map(player => {
        const fantasyPositions = player.fantasy_positions ?
            player.fantasy_positions.map(position => normalizeString(position)) : null;
        const position = player.position ? normalizeString(player.position) : null;
        const team = player.team ? normalizeString(player.team) : null;
        const number = player.number ? player.number : null;
        const injuryStatus = player.injury_status ? player.injury_status : null;
        const age = player.age ? player.age : null;

        return {
            playerId: normalizeString(player.player_id),
            firstName: normalizeString(player.first_name),
            lastName: normalizeString(player.last_name),
            active: player.active,
            fantasyPositions,
            position,
            team,
            number,
            age,
            injuryStatus,
        } satisfies InsertNFLPlayer;
    });
}
