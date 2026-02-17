import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { getAllTimeStats, assembleLeagueStatsPageData } from "../services/web/league-stats-service.js";

export type LeagueStatsPageParams = {
    leagueId: string;
};

export async function handlerApiAllTimeStats(_: Request, res: Response) {
    const stats = await getAllTimeStats();
    respondWithJSON(res, 200, { stats });
}

export async function handlerApiLeagueStatsPage(req: Request<LeagueStatsPageParams>, res: Response) {
    const data = await assembleLeagueStatsPageData(req.params.leagueId);
    respondWithJSON(res, 200, data);
}
