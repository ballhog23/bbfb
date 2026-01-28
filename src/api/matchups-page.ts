import type { Request, Response } from "express";
import { config } from "../config.js";
import { respondWithJSON } from "../lib/json.js";
import { assembleMatchupsData } from "../services/api/matchup-standings-service.js";

export type MatchupsPageParams = {
    leagueId: string;
    week: string;
};

export async function handlerApiMatchupsPage(req: Request<MatchupsPageParams>, res: Response) {
    const currentLeagueId = req.params.leagueId ?? config.league.id;
    const currentWeek = req.params.week ?? "";
    const matchupsPage = await assembleMatchupsData(currentLeagueId, currentWeek);

    respondWithJSON(res, 200, matchupsPage);
}
