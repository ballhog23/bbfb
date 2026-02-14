import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { selectLeagueState } from "../db/queries/league-state.js";
import { NotFoundError } from "../lib/errors.js";

export type LeagueParams = {
    leagueId: string;
};


export async function handlerGetLeagueState(_: Request, res: Response) {
    const leagueState = await selectLeagueState();
    if (!leagueState)
        throw new NotFoundError('League state not found');

    const data = {
        leagueState,
        status: 'ok',
    };

    respondWithJSON(res, 200, data);
}