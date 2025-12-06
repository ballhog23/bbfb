import type { Request, Response } from "express";
import { Sleeper } from '../lib/sleeper.js';
import { respondWithJSON } from "../lib/json.js";

export async function handlerLeague(_: Request, res: Response) {
	const sleeper = new Sleeper();
	const league = await sleeper.getLeague();
	const prevLeague = await sleeper.getPreviousLeagues(league);
	const allLeagues = [league];
	if (prevLeague) {
		allLeagues.push(...prevLeague);
	}

	const data = {
		allLeagues
	};

	respondWithJSON(res, 200, data);
}