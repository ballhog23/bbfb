import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { buildRegularSeasonLeagueMatchups } from "../services/matchups-service.js";
import { selectAllMatchups } from "../db/queries/matchup.js";

export async function handlerGetMatchups(_: Request, res: Response) {
    const matchups = await buildRegularSeasonLeagueMatchups();

    const data = {
        matchups
    };

    respondWithJSON(res, 200, data);
}

export async function handlerGetMatchup(_: Request, res: Response) {
    const data = {
        dog: 'cat'
    };

    respondWithJSON(res, 200, data);
}