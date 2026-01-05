import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { } from "../db/queries/matchup.js";
import { BadRequestError } from "../lib/errors.js";
import { selectAllLeagueMatchupOutcomes } from "../db/queries/matchup-outcomes.js";

export async function handlerGetLeagueMatchupOutcomes(_: Request, res: Response) {

    const matchups = await selectAllLeagueMatchupOutcomes();


    const data = {
        matchups
    };

    respondWithJSON(res, 200, data);
}