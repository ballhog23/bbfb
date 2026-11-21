import { respondWithJSON } from "../lib/json.js";
import { assembleMatchupsPageData } from "../services/web/matchups-page-service.js";
export async function handlerApiMatchupsPage(req, res) {
    const matchupsPage = await assembleMatchupsPageData(req.params.leagueId, req.params.week);
    respondWithJSON(res, 200, matchupsPage);
}
