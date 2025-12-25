import type { Request, Response } from "express";
import { respondWithError, respondWithJSON } from "../lib/json.js";
import { buildAndInsertLeagueHistory, insertLeagueService } from "../services/league-service.js";
import { selectAllLeagues, selectLeague } from "../db/queries/leagues.js";
import { NotFoundError } from "../lib/errors.js";

export type LeagueParams = {
	leagueId: string;
};

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
export async function handlerInsertLeagueHistory(_: Request, res: Response) {
	const leagues = await buildAndInsertLeagueHistory();

	const data = {
		status: 'Sleeper league history successfully built.',
		leagues
	};

	respondWithJSON(res, 201, data);
}

export async function handlerInsertLeague(_: Request, res: Response) {
	const leagues = await insertLeagueService();

	const data = {
		status: 'Sleeper league sucessfully inserted.',
		leagues
	};

	respondWithJSON(res, 201, data);
}