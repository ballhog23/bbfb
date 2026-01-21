import { Request, Response } from "express";
import { selectLeagueState } from "../db/queries/league-state.js";
import { config } from "../config.js";
import { selectAllLeaguesIdsAndSeasons } from "../db/queries/leagues.js";
import { selectLeagueMatchupsByWeekWithoutByes } from "../db/queries/matchups.js";

type MatchupParams = {
    leagueId: string;
    week: string;
};

type MatchupRow = Awaited<ReturnType<typeof selectLeagueMatchupsByWeekWithoutByes>>[number];
type MatchupTuple = [MatchupRow, MatchupRow];

export async function handlerServeMatchups(req: Request<MatchupParams>, res: Response) {
    const leagueState = await selectLeagueState();
    if (!leagueState)
        return res.render('pages/404');

    const currentLeagueId = req.params.leagueId;
    const currentWeek = parseInt(req.params.week);
    const [allLeagues, orderedMatchups] = await Promise.all([
        selectAllLeaguesIdsAndSeasons(),
        selectLeagueMatchupsByWeekWithoutByes(currentLeagueId, currentWeek)
    ]);
    const matchups: MatchupTuple[] = [];
    for (let i = 0; i < orderedMatchups.length; i += 2) {
        matchups.push([orderedMatchups[i], orderedMatchups[i + 1]]);
    }
    console.log(matchups);
    return res.render('pages/matchups',
        {
            leagueState,
            allLeagues,
            currentLeagueId,
            currentWeek,
            matchups
        }
    );
}

export async function handlerRedirectToMatchups(req: Request, res: Response) {
    const leagueState = await selectLeagueState();
    if (!leagueState)
        return res.render('pages/404');

    // sending user to current league state e.g., leagueId 123 week 14
    const redirectURL = `/matchups/leagues/${config.league.id}/weeks/${leagueState.displayWeek}`;
    return res.redirect(302, redirectURL);
}