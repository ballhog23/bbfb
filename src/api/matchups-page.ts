import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { assembleMatchupsPageData } from "../services/api/matchups-page-service.js";

export type MatchupsPageParams = {
    leagueId: string;
    week: string;
};

export async function handlerApiMatchupsPage(req: Request<MatchupsPageParams>, res: Response) {
    const matchupsPage = await assembleMatchupsPageData(
        req.params.leagueId,
        req.params.week
    );

    respondWithJSON(res, 200, matchupsPage);
}