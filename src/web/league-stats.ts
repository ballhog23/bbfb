import type { Request, Response } from "express";
import { getAllTimeStats, assembleLeagueStatsPageData } from "../services/web/league-stats-service.js";
import { getLeaguesForDropdown } from "../services/web/matchups-page-service.js";
import { selectLeagueState } from "../db/queries/league-state.js";
import { NotFoundError } from "../lib/errors.js";

export async function handlerServeLeagueStats(_: Request, res: Response) {
    const leagueState = await selectLeagueState();
    if (!leagueState) throw new NotFoundError("League state not found");

    const allLeagues = await getLeaguesForDropdown(leagueState);

    const sections = await getAllTimeStats();

    return res.render('pages/league-stats-page', {
        page: 'league-stats',
        title: 'Hall of Stats & Laughs',
        description: 'Bleed Blue Fantasy Football - League Statistics',
        sections,
        allLeagues,
    });
}

export type LeagueStatsParams = {
    leagueId: string;
};

export async function handlerServeLeagueStatsBySeason(req: Request<LeagueStatsParams>, res: Response) {
    const statsData = await assembleLeagueStatsPageData(req.params.leagueId);

    return res.render('pages/league-stats-page', {
        page: 'league-stats',
        title: `Stats - ${statsData.currentSeason} Season`,
        description: `Bleed Blue Fantasy Football - ${statsData.currentSeason} Season Statistics`,
        sections: statsData.sections,
        allLeagues: statsData.allLeagues,
        currentLeagueId: statsData.currentLeagueId,
        currentSeason: statsData.currentSeason,
        isSeasonView: true,
    });
}
