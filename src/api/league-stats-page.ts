import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { assembleAllTimeStatsPageData, assembleLeagueStatsPageData } from "../services/web/league-stats-service.js";

export type LeagueStatsPageParams = {
    leagueId: string;
};

export async function handlerApiAllTimeStats(_: Request, res: Response) {
    const statsData = await assembleAllTimeStatsPageData();
    respondWithJSON(res, 200, statsData);
}

export async function handlerApiLeagueStatsPage(req: Request<LeagueStatsPageParams>, res: Response) {
    const statsData = await assembleLeagueStatsPageData(
        req.params.leagueId,
    );

    respondWithJSON(res, 200, statsData);
}