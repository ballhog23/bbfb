import type { Request, Response } from "express";
import type { MatchupsPageParams } from "../api/matchups-page.js";
import { assembleMatchupsData } from "../services/api/matchup-standings-service.js";
import { selectLeagueState } from "../db/queries/league-state.js";
import { config } from "../config.js";

// need to implement error handling like 4XX, 5XX etc
export async function handlerServeMatchupsPage(req: Request<MatchupsPageParams>, res: Response) {
    const currentLeagueId = req.params.leagueId ?? config.league.id;
    const currentWeek = req.params.week ?? "";

    const matchupsPage = await assembleMatchupsData(currentLeagueId, currentWeek);

    return res.render('pages/matchups', { ...matchupsPage });
}

export async function handlerRedirectToMatchups(req: Request, res: Response) {
    const leagueState = await selectLeagueState();
    if (!leagueState)
        return res.render('pages/404');

    // sending user to current league state e.g., leagueId 123 week 14
    const redirectURL = `/matchups/leagues/${config.league.id}/weeks/${leagueState.displayWeek}`;
    return res.redirect(302, redirectURL);
}

