import type { Request, Response } from "express";
import { selectLeague } from "../db/queries/leagues.js";
import { config } from "../config.js";
import { selectAllLeagues } from "../db/queries/leagues.js";
import { selectLeagueMatchupsByWeek } from "../db/queries/matchups.js";

export type LeagueParams = {
	leagueId: string;
	week: string;
};

// handles select-a-season/week filtering
export async function handlerGetLeague(req: Request<LeagueParams>, res: Response) {
	const params = req.params;
	const { leagueId } = params;

	const allLeagues = await selectAllLeagues();
	const allLeagueIds = allLeagues.map(({ leagueId }) => leagueId);

	if (!allLeagueIds.find(id => leagueId === id))
		return res.status(404).render('error', { req });

	const currentLeague = await selectLeague(leagueId);
	const canonical = leagueId === config.league.id;
	const origin = `${req.protocol}://${req.get('host')}`;
	res.render('leagues', { currentLeague, allLeagues, canonical, origin });
}

// handles initial page load at /leagues
export async function handlerGetCurrentLeague(req: Request, res: Response) {
	const currentLeague = await selectLeague(config.league.id);
	if (!currentLeague)
		return res.status(404).render('error', { req });

	const allLeagues = await selectAllLeagues();
	const matchupsWeekOne = await selectLeagueMatchupsByWeek(config.league.id, 1);
	const groupedMatches = Object.groupBy(matchupsWeekOne, ({ matchupId }) => matchupId ? matchupId : 'bye');
	res.render('leagues', { currentLeague, allLeagues, matchupsWeekOne, groupedMatches });
}