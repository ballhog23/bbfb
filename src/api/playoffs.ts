import type { Request, Response } from "express";
import { selectAllPlayoffMatchups, selectPlayoffMatchupsPerSeason } from "../db/queries/playoffs.js";
import { respondWithJSON } from "../lib/json.js";
import { selectPlayoffMatchups } from "../db/queries/matchups.js";
import { getAllPlayoffBracketsHistory } from "../services/playoffs-service.js";

export async function handlerGetPlayoffBracket(_: Request, res: Response) {
    const matchups = await getAllPlayoffBracketsHistory();
    // const matchups = await selectPlayoffMatchupsPerSeason('1257436036187824128');

    const data = {
        matchups
    };

    respondWithJSON(res, 200, data);
}