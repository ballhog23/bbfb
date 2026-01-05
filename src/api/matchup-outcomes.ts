import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { } from "../db/queries/matchup.js";
import { BadRequestError } from "../lib/errors.js";
import { selectAllLeagueMatchupOutcomes, selectLeaguePointsScoredPerUser, selectAllTimePointsScoredPerUser } from "../db/queries/matchup-outcomes.js";

export async function handlerGetLeagueMatchupOutcomes(_: Request, res: Response) {

    const matchups = await selectAllTimePointsScoredPerUser();


    const data = {
        matchups
    };

    respondWithJSON(res, 200, data);
}