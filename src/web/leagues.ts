import type { Request, Response } from "express";
import { selectLeague } from "../db/queries/leagues.js";
import { config } from "../config.js";
import { selectAllLeagues } from "../db/queries/leagues.js";
import { selectLeagueMatchupsByWeek } from "../db/queries/matchups.js";
import { selectLeagueState } from "../db/queries/league-state.js";
import { weeks } from "../lib/helpers.js";

export type LeagueParams = {
	leagueId: string;
	week: string;
};

// handles select-a-season/week filtering
export async function handlerGetLeague(req: Request<LeagueParams>, res: Response) {
	const leagueState = await selectLeagueState();
	const leagueId = req.params.leagueId ?? config.league.id;
	const week = parseInt(req.params.week) ?? leagueState.displayWeek;

	const allLeagues = await selectAllLeagues();
	const allLeagueIds = allLeagues.map(({ leagueId }) => leagueId);

	if (!allLeagueIds.some(id => leagueId === id))
		return res.status(404).render('error', { req });

	const [currentLeague] = allLeagues.filter(league => league.leagueId === leagueId);
	const canonical = leagueId === config.league.id;
	const origin = `${req.protocol}://${req.get('host')}`;
	const matchups = await selectLeagueMatchupsByWeek(leagueId, week);
	const filteredMatchups = matchups.filter(matchup => matchup.matchupId !== null);
	const groupedMatches = Object.groupBy(filteredMatchups, ({ matchupId }) => matchupId ? matchupId : 'bye');

	res.render('pages/leagues', { currentLeague, allLeagues, canonical, origin, groupedMatches, weeks, leagueState });
}

// handles initial page load at /leagues, sends it to the current state of the league
export async function handlerGetCurrentLeague(req: Request, res: Response) {
	if (!config.league.id)
		return res.status(404).render('error', { req });

	const leagueState = await selectLeagueState();
	res.redirect(302, `/leagues/${config.league.id}/weeks/${leagueState.displayWeek}`);
}