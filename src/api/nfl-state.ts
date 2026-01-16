import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { selectLeagueState } from "../db/queries/league-state.js";

export type LeagueParams = {
    leagueId: string;
};


export async function handlerGetLeagueState(_: Request, res: Response) {
    const leagueState = await selectLeagueState();

    const data = {
        leagueState,
        status: 'ok',
    };

    respondWithJSON(res, 200, data);
}