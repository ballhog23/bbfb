import type { Request, Response } from "express";
import { Sleeper } from '../lib/sleeper.js';
import { respondWithJSON } from "../lib/json.js";
import { insertLeague, selectAllLeagues, selectLeague } from "../db/queries/leagues.js";
import { NotFoundError } from "../lib/errors.js";


export async function handlerLeagues(_: Request, res: Response) {
	const leagues = await selectAllLeagues();

	if (!leagues) {
		throw new NotFoundError('no leagues found');
	}

	const data = {
		leagues,
		status: 'ok',
	};

	respondWithJSON(res, 200, data);
}

export async function handlerGetLeague(req: Request<LeagueParams>, res: Response) {
	const params = req.params;
	const league = await selectLeague(params.leagueId);

	if (!league) throw new NotFoundError(`League not found with id: ${params.leagueId}`);

	const data = {
		league
	};

	respondWithJSON(res, 200, data);
}

export async function handlerInsertLeagues(_: Request, res: Response) {
	const sleeper = new Sleeper();
	const league = await sleeper.getLeague();
	const prevLeagues = await sleeper.getPreviousLeagues(league);
	const allLeagues = [league, ...(prevLeagues ?? [])];
	const result = await insertLeague(allLeagues);

	const data = {
		status: 'ok',
		allLeagues: result
	};

	respondWithJSON(res, 200, data);
}

type LeagueParams = {
	leagueId: string;
};
