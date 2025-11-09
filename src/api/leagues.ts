import type { Request, Response } from "express";
import { Sleeper } from "../lib/sleeper.js";
import { respondWithJSON } from "../lib/json.js";
import { buildLeagueHistory, rawToNormalizedLeagueData } from "../services/leagueService.js";
import { insertLeague, selectAllLeagues, selectLeague, dropAllLeagues } from "../db/queries/leagues.js";
import { NotFoundError } from "../lib/errors.js";

// working
export async function handlerGetLeagues(_: Request, res: Response) {
	const leagues = await selectAllLeagues();
	if (leagues.length === 0) throw new NotFoundError('No leagues found.');

	const data = {
		leagues,
		status: 'ok',
	};

	respondWithJSON(res, 200, data);
}

// working
export async function handlerGetLeague(req: Request<LeagueParams>, res: Response) {
	const params = req.params;
	const league = await selectLeague(params.leagueId);
	if (!league) throw new NotFoundError(`League not found with id: ${params.leagueId}`);

	const data = {
		league
	};

	respondWithJSON(res, 200, data);
}

// working
export async function handlerSyncLeague(req: Request, res: Response) {
	const sleeper = new Sleeper();
	const [currentSleeperLeague] = rawToNormalizedLeagueData([await sleeper.getLeague()]);
	const result = await insertLeague(currentSleeperLeague);

	const data = {
		result
	};

	respondWithJSON(res, 200, data);
}

// working
export async function handlerInsertLeagueHistory(_: Request, res: Response) {
	const leagues = await buildLeagueHistory();

	for (const league of leagues) {
		await insertLeague(league);
	}

	const data = {
		status: 'Sleeper league history successfully built.',
		leagues
	};

	respondWithJSON(res, 201, data);
}

// working
export async function handlerDeleteLeagues(_: Request, res: Response) {
	await dropAllLeagues();

	respondWithJSON(res, 200, { status: 'deleted all leagues' });
}

export type LeagueParams = {
	leagueId: string;
};
