import { respondWithJSON } from "../lib/json.js";
import { selectLeagueState } from "../db/queries/league-state.js";
import { NotFoundError } from "../lib/errors.js";
export async function handlerGetLeagueState(_, res) {
    const leagueState = await selectLeagueState();
    if (!leagueState)
        throw new NotFoundError("League state not found");
    const data = {
        leagueState,
        status: "ok",
    };
    respondWithJSON(res, 200, data);
}
