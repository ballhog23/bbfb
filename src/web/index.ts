import { Request, Response } from "express";
import { selectLeagueState } from "../db/queries/league-state.js";
import { selectLeagueLoser, selectLeagueWinner } from "../db/queries/playoffs.js";
import { config } from "../config.js";

export async function handlerServeIndex(req: Request, res: Response) {
    const leagueState = await selectLeagueState();
    if (!leagueState)
        return res.render('pages/404');

    const queries = [];

    if (leagueState.leg > 17)
        queries.push(
            selectLeagueWinner(config.league.id),
            selectLeagueLoser(config.league.id)
        );

    const results = await Promise.all(queries);
    const [winner, loser] = results;
    return res.render('pages/index', { leagueState, winner, loser, page: 'homepage' });
}