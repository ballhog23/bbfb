import { Request, Response } from "express";
import { selectLeagueState } from "../db/queries/league-state.js";
import { config } from "../config.js";

export async function handlerServeMatchups(req: Request, res: Response) {
    const leagueState = await selectLeagueState();
    if (!leagueState)
        return res.render('pages/404');

    const queries = [];

    return res.render('pages/matchups', { leagueState });
}