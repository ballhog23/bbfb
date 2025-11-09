import type { Request, Response } from "express";
import { Sleeper } from '../lib/sleeper.js';


export async function handlerLeague(_: Request, res: Response) {
	const sleeper = new Sleeper();
	const users = await sleeper.getLeagueUsers();
	const caleb = await sleeper.getLeagueUser("726308671558070272")
	const rosters = await sleeper.getLeagueRosters();
	const league = await sleeper.getLeague();

	const data = {
		users
	};

	res.send(data);
}