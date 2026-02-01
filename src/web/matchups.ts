import type { Request, Response } from "express";
import { assembleMatchupsPageData } from "../services/api/matchups-page-service.js";
import { selectLeagueState } from "../db/queries/league-state.js";
import { config } from "../config.js";



export type MatchupsPageParams = {
    leagueId: string;
    week: string;
};

export async function handlerServeMatchupsPage(req: Request<MatchupsPageParams>, res: Response) {
    const matchupsPage = await assembleMatchupsPageData(
        req.params.leagueId,
        req.params.week
    );

    return res.render('pages/matchups', { ...matchupsPage, page: 'matchups' });
}

export async function handlerRedirectToMatchups(_: Request, res: Response) {
    const leagueState = await selectLeagueState();
    if (!leagueState)
        return res.render('pages/404');

    // sending user to current league state e.g., leagueId 123 week 14
    const redirectURL = `/matchups/leagues/${config.league.id}/weeks/${leagueState.displayWeek}`;
    return res.redirect(302, redirectURL);
}

