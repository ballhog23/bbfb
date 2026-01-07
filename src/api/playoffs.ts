import type { Request, Response } from "express";
import { buildPlayoffMatchups, buildPlayoffBracketHistory } from "../services/playoffs-service.js";
import { respondWithJSON } from "../lib/json.js";

export async function handlerGetPlayoffBracket(_: Request, res: Response) {
    const matchups = await buildPlayoffBracketHistory();

    const data = {
        matchups
    };

    respondWithJSON(res, 200, data);
}