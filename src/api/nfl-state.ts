import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { BadRequestError } from "../lib/errors.js";

export type LeagueParams = {
    leagueId: string;
};


export async function handlerGetLeagueState(_: Request, res: Response) {
    const leagueState = null;

    const data = {
        leagueState,
        status: 'ok',
    };

    respondWithJSON(res, 200, data);
}