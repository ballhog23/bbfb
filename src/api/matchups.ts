import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { buildLeagueMatchupHistory } from "../services/matchups-service.js";

export async function handlerGetMatchups(_: Request, res: Response) {
    const matchups = await buildLeagueMatchupHistory();

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