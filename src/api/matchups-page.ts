import type { Request, Response } from "express";
import { config } from "../config.js";
import { respondWithJSON } from "../lib/json.js";
// import { assembleMatchupsData } from "../services/api/matchups-page-service.js";

export type MatchupsPageParams = {
    leagueId: string;
    week: string;
};

export async function handlerApiMatchupsPage(req: Request<MatchupsPageParams>, res: Response) {
    // const matchupsPage = await assembleMatchupsData(req.params.leagueId, req.params.week);

    // respondWithJSON(res, 200, matchupsPage);
}
