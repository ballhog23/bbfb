import type { Request, Response } from "express";
import { config } from "../config.js";
import { respondWithJSON } from "../lib/json.js";
import {
    discernMatchupsView,
    assembleRegularSeasonMatchupsData,
    assemblePostSeasonMatchupsData
} from "../services/api/matchups-page-service.js";

export type MatchupsPageParams = {
    leagueId: string;
    week: string;
};

export async function handlerApiMatchupsPage(req: Request<MatchupsPageParams>, res: Response) {
    const { matchupsView, leagueState } = await discernMatchupsView(req.params.week);

    let matchupsPage;

    if (matchupsView === 'regular') {
        matchupsPage = await assembleRegularSeasonMatchupsData(
            leagueState,
            req.params.leagueId,
            req.params.week
        );
    } else {
        matchupsPage = await assemblePostSeasonMatchupsData(
            leagueState,
            req.params.leagueId,
            req.params.week
        );
    }

    respondWithJSON(res, 200, matchupsPage);
}
