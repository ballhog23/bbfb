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

export async function handlerRedirectToMatchups(req: Request, res: Response) {
    const leagueState = await selectLeagueState();
    if (!leagueState)
        return res.render('pages/404');

    // sending user to current league state e.g., leagueId 123 week 14
    const redirectURL = `/matchups/leagues/${config.league.id}/weeks/${leagueState.displayWeek}`;
    return res.redirect(302, redirectURL);
}