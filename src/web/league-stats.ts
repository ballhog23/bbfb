import type { Request, Response } from "express";
import { getAllTimeStats, assembleLeagueStatsPageData } from "../services/web/league-stats-service.js";
import { selectAllLeaguesIdsAndSeasons } from "../db/queries/leagues.js";

export async function handlerServeLeagueStats(_: Request, res: Response) {
    const allLeagues = await selectAllLeaguesIdsAndSeasons();
    const sections = getAllTimeStats();

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
