import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { assembleLeagueStatsPageData } from "../services/web/league-stats-service.js";

export type LeagueStatsPageParams = {
    leagueId: string;
};

export async function handlerApiMatchupsPage(req: Request<LeagueStatsPageParams>, res: Response) {
    const matchupsPage = await assembleLeagueStatsPageData(
        req.params.leagueId,
    );

    respondWithJSON(res, 200, matchupsPage);
}