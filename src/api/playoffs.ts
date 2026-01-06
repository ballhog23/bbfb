import type { Request, Response } from "express";
import { buildPlayoffMatchups } from "../services/playoffs.js";
import { respondWithJSON } from "../lib/json.js";

export async function handlerGetPlayoffBracket(_: Request, res: Response) {
    const matchups = await buildPlayoffMatchups();

    const data = {
        matchups
    };

    respondWithJSON(res, 200, data);
}