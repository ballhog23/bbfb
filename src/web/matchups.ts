import type { Request, Response } from "express";
import { assembleMatchupsPageData } from "../services/web/matchups-page-service.js";
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
    const title = `Matchups | Season ${matchupsPage.currentLeagueSeason} Week ${matchupsPage.currentWeek}`;

    return res.render('pages/matchups', {
        ...matchupsPage,
        page: 'matchups',
        title,
        description: `Sleeper Fantasy Football ${title}`
    });
}

export async function handlerRedirectToMatchups(_: Request, res: Response) {
    const leagueState = await selectLeagueState();
    if (!leagueState)
        return res.render('pages/404');

    // if the league isn't active and env vars point to a newer league than league state,
    // redirect to previous season (handles early env var updates before new season has data)
    const envUpdatedAhead = !leagueState.isLeagueActive && leagueState.season !== config.league.season;
    const leagueId = envUpdatedAhead
        ? config.league.prevId
        : config.league.id;
    const redirectURL = `/matchups/leagues/${leagueId}/weeks/${leagueState.displayWeek}`;
    return res.redirect(302, redirectURL);
}

