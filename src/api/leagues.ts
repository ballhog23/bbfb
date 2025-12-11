import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { buildLeagueHistory } from "../services/leagueService.js";
import { insertLeague, selectAllLeagues, selectLeague, dropAllLeagues } from "../db/queries/leagues.js";
import { NotFoundError } from "../lib/errors.js";

export async function handlerInsertLeagues(_: Request, res: Response) {
	const leagues = await buildLeagueHistory();
	await insertLeague(leagues);
	const data = {
		status: 'ok',
		leagues
	};

	respondWithJSON(res, 201, data);
}

export async function handlerGetLeagues(_: Request, res: Response) {
	const leagues = await selectAllLeagues();
	console.log(leagues);
	if (leagues.length === 0) throw new NotFoundError('No leagues found.');

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

export async function handlerDeleteLeagues(_: Request, res: Response) {
	await dropAllLeagues();

	respondWithJSON(res, 200, 'deleted all users');
}

export type LeagueParams = {
	leagueId: string;
};
