import { respondWithJSON } from "../lib/json.js";
import { getAllTimeStats, assembleLeagueStatsPageData, } from "../services/web/league-stats-service.js";
export async function handlerApiAllTimeStats(_, res) {
    const stats = await getAllTimeStats();
    respondWithJSON(res, 200, { stats });
}
export async function handlerApiLeagueStatsPage(req, res) {
    const data = await assembleLeagueStatsPageData(req.params.leagueId);
    respondWithJSON(res, 200, data);
}
