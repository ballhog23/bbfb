import { Request, Response } from "express";
import { selectLeagueState } from "../db/queries/league-state.js";
import { selectLeagueLoser, selectLeagueWinner } from "../db/queries/playoffs.js";
import { config } from "../config.js";

export async function handlerServeIndex(req: Request, res: Response) {
    const leagueState = await selectLeagueState();
    if (!leagueState)
        return res.render('pages/404');

    // only use current league for winner/loser when it just finished (inactive + seasons match)
    // during active season or when env vars are updated early, use previous league
    const seasonJustFinished = !leagueState.isLeagueActive && leagueState.season === config.league.season;
    const completedLeagueId = seasonJustFinished ? config.league.id : config.league.prevId;
    const completedLeagueSeason = seasonJustFinished ? config.league.season : config.league.prevSeason;

    const [winner, loser] = await Promise.all([
        selectLeagueWinner(completedLeagueId),
        selectLeagueLoser(completedLeagueId)
    ]);

    return res.render('pages/index', {
        leagueState,
        prevLeagueSeason: completedLeagueSeason,
        winner,
        loser,
        page: 'homepage',
        description: `Bleed Blue Fantasy Football League. 12 dudes shootin' the shit. Go Cowboys.`
    });
}