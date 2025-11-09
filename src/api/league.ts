import type { NextFunction, Request, Response } from "express";
import type { User } from "./types";
import { config } from "../config";
import { NotFoundError } from "../lib/errors";

export async function handlerLeague(_: Request, res: Response) {
	const leagueId = config.league.id;
	const users = await getLeagueUsers(leagueId);
	const rosters = await getLeagueRosters(leagueId);

	const data = {
		rosters
	};

	res.send(data);
}

export async function getLeague(leagueId: string) {
	const url = `https://api.sleeper.app/v1/league/${leagueId}`;
	const league = await fetch(url);

	if (!league)
		throw new NotFoundError(
			"The league was not found. Please make sure your League ID is correct."
		);

	return await league.json();
}

export async function getLeagueRosters(leagueId: string) {
	const url = `https://api.sleeper.app/v1/league/${leagueId}/rosters`;
	const leagueRosters = await fetch(url);

	if (!leagueRosters)
		throw new NotFoundError(
			`No rosters were found for League ID: ${leagueId}. Please make sure your League ID is correct.`
		);

	return await leagueRosters.json();
}

export async function getLeagueUsers(leagueId: string): Promise<User[]> {
	const url = `https://api.sleeper.app/v1/league/${leagueId}/users`;
	const leagueUsers = await fetch(url);

	if (!leagueUsers)
		throw new NotFoundError(
			`No users were found for League ID: ${leagueId}. Please make sure your League ID is correct.`
		);

	return await leagueUsers.json();
}

export async function getUser(userId: string): Promise<User> {
	const url = `https://api.sleeper.app/v1/user/${userId}`;
	const user = await fetch(url);

	if (!user.ok) {
		throw new NotFoundError(`Something went wrong with the request. Check UserId: ${userId}`)
	}

	return await user.json();
}

export async function getThisWeeksLeagueMatchups(
	leagueId: string,
	week: number
) {
	const url = `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`;
	const leagueMatchups = await fetch(url);

	if (!leagueMatchups)
		throw new NotFoundError(
			`No league matchups were found for League ID: ${leagueId}. Please make sure your League ID is correct.`
		);

	return await leagueMatchups.json();
}

// endpoint is currently only returning losers_bracket
export async function getLeaguePlayoffBracket(
	leagueId: string,
	bracket: "winners_bracket" | "losers_bracket"
) {
	console.log(bracket)
	const url = `https://api.sleeper.app/v1/league/${leagueId}/${bracket}`;
	const playoffBracket = await fetch(url);

	if (!playoffBracket)
		throw new NotFoundError(
			`No playoff brackets were found for League ID: ${leagueId}. Please make sure your League ID is correct.`
		);

	return await playoffBracket.json();
}

export async function getLeagueTransactions(leagueId: string, week: number) {
	const url = `https://api.sleeper.app/v1/league/${leagueId}/transactions/${week}`;
	const leagueTransactions = await fetch(url);
	if (!leagueTransactions)
		throw new NotFoundError(
			`No transactions found. Either a single transaction wasn't made or perhaps your League ID: ${leagueId} is incorrect.`
		);

	return await leagueTransactions.json();
}

export async function getNFLState() {
	const url = `https://api.sleeper.app/v1/state/nfl`;
	const nflState = await fetch(url);

	if (!nflState)
		throw new NotFoundError(
			`The current state of the NFL according to sleeper was not found.`
		);

	return await nflState.json();
}

export async function getLeagueDraft(leagueId: string) {
	const url = `https://api.sleeper.app/v1/league/${leagueId}/drafts`;
	const leagueDrafts = await fetch(url);

	if (!leagueDrafts)
		throw new NotFoundError(`No drafts found for League ID: ${leagueId}. Please make sure your League ID is correct`);

	return await leagueDrafts.json();
}