import type { Request, Response } from "express";
import { Sleeper } from '../lib/sleeper.js';

export async function handlerLeague(_: Request, res: Response) {
	const sleeper = new Sleeper();
	const league = await sleeper.getLeague();
	const rosters = await sleeper.getLeagueRosters();
	const users = await sleeper.getLeagueUsers();
	const playoff = await sleeper.getLeaguePlayoffBracket('losers_bracket');
	const matchups = await sleeper.getThisWeeksLeagueMatchups(1);
	const players = await sleeper.getAllPlayers();
	const data = {
		players
	};



	res.send(data);
}