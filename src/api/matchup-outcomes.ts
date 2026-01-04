import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { } from "../db/queries/matchup.js";
import { buildAndInsertLeagueMatchupOutcomes } from "../services/matchups-outcomes-service.js";
import { BadRequestError } from "../lib/errors.js";

export async function handlerGetLeagueMatchupOutcomes(_: Request, res: Response) {

    const matchups = await buildAndInsertLeagueMatchupOutcomes();


    const data = {
        matchups
    };

    respondWithJSON(res, 200, data);
}