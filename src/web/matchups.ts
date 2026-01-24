import { Request, Response } from "express";
import { selectLeagueState } from "../db/queries/league-state.js";
import { config } from "../config.js";
import { selectAllLeaguesIdsAndSeasons } from "../db/queries/leagues.js";
import { selectLeagueMatchupsByWeekWithoutByes } from "../db/queries/matchups.js";
import { groupAdjacentMatchups } from "../lib/helpers.js";

type MatchupParams = {
    leagueId: string;
    week: string;
};

export async function handlerServeMatchups(req: Request<MatchupParams>, res: Response) {
    const leagueState = await selectLeagueState();
    if (!leagueState)
        return res.render('pages/404');

    const currentLeagueId = req.params.leagueId ?? config.league.id;
    const currentWeek = parseInt(req.params.week) ?? leagueState.displayWeek;
    const [allLeagues, orderedMatchups] = await Promise.all([
        selectAllLeaguesIdsAndSeasons(),
        selectLeagueMatchupsByWeekWithoutByes(currentLeagueId, currentWeek)
    ]);
    const [currentLeague] = allLeagues.filter(league => league.leagueId === currentLeagueId);
    const currentLeagueSeason = currentLeague.season;
    const matchups = groupAdjacentMatchups(orderedMatchups);

    return res.render('pages/matchups',
        {
            allLeagues,
            currentLeagueId,
            currentLeagueSeason,
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

