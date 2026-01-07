import type { Request, Response } from "express";
import { selectAllPlayoffMatchups } from "../db/queries/playoffs.js";
import { respondWithJSON } from "../lib/json.js";

export async function handlerGetPlayoffBracket(_: Request, res: Response) {
    const matchups = await selectAllPlayoffMatchups();

    const data = {
        matchups
    };

    respondWithJSON(res, 200, data);
}