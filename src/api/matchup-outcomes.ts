import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { } from "../db/queries/matchup.js";
import { BadRequestError } from "../lib/errors.js";
import {
    selectAllLeagueMatchupOutcomes, selectRegularSeasonWLRPerUser,
    selectAllTimeWinLossRatioPerUser, selectLeaguePointsScoredPerUser,
    selectAllTimePointsScoredPerUser
} from "../db/queries/matchup-outcomes.js";

export async function handlerGetLeagueMatchupOutcomes(_: Request, res: Response) {

    const matchups = await selectRegularSeasonWLRPerUser('1257436036187824128');


    const data = {
        matchups
    };

    respondWithJSON(res, 200, data);
}