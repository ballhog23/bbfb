import type { Request, Response } from "express";
import { getAllTimeStats, assembleLeagueStatsPageData } from "../services/web/league-stats-service.js";
import { getLeaguesForDropdown } from "../services/web/matchups-page-service.js";
import { selectLeagueState } from "../db/queries/league-state.js";
import { BadRequestError, NotFoundError } from "../lib/errors.js";
import type { LeagueStatsPageParams } from "src/api/league-stats-page.js";

export async function handlerServeLeagueStats(_: Request, res: Response) {
    const leagueState = await selectLeagueState();
    if (!leagueState)
        throw new NotFoundError("League state not found");

    const [allLeagues, stats] =
        await Promise.all([
            getLeaguesForDropdown(leagueState),
            getAllTimeStats()
        ]);

    return res.render('pages/league-stats-page', {
        page: 'league-stats',
        title: 'Hall of Stats & Laughs',
        description: 'Bleed Blue Fantasy Football - League Statistics',
        stats,
        allLeagues,
    });
}

export async function handlerServeLeagueStatsBySeason(req: Request<LeagueStatsPageParams>, res: Response) {
    const { leagueId } = req.params;
    if (!leagueId)
        throw new BadRequestError(`League ${leagueId} not found`);

    const data = await assembleLeagueStatsPageData(leagueId);

    return res.render('pages/league-stats-page', {
        page: 'league-stats',
        title: `Stats - ${data.currentSeason} Season`,
        description: `Bleed Blue Fantasy Football - ${data.currentSeason} Season Statistics`,
        stats: data.stats,
        allLeagues: data.allLeagues,
        currentLeagueId: data.currentLeagueId,
        currentSeason: data.currentSeason,
        isSeasonView: true,
    });
}
