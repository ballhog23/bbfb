import { respondWithJSON } from "../lib/json.js";
import { selectAllLeagues, selectLeague } from "../db/queries/leagues.js";
import { NotFoundError } from "../lib/errors.js";
// working
export async function handlerGetLeagues(_, res) {
    const leagues = await selectAllLeagues();
    if (leagues.length === 0)
        throw new NotFoundError("No leagues found.");
    const data = {
        leagues,
        status: "ok",
    };
    respondWithJSON(res, 200, data);
}
// working
export async function handlerGetLeague(req, res) {
    const params = req.params;
    const league = await selectLeague(params.leagueId);
    if (!league)
        throw new NotFoundError(`League not found with id: ${params.leagueId}`);
    const data = {
        league,
    };
    respondWithJSON(res, 200, data);
}
