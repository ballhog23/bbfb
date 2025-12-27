import type { Request, Response } from "express";
import { buildAndInsertLeagueHistory } from "../services/league-service.js";
import { buildLeagueUsersHistory, buildAndInsertLeagueUserHistory } from "../services/league-users-service.js";
import { buildAndInsertSleeperUsersHistory } from "../services/sleeper-users-service.js";
import { respondWithJSON } from "../lib/json.js";
import { buildAndInsertNFLPlayers } from "../services/players-service.js";

export async function handlerHistoryBootstrap(_: Request, res: Response) {
    console.log('POPULATING LEAGUES...');
    await buildAndInsertLeagueHistory();
    console.log('LEAGUES POPULATED!');

    console.log('BUILDING SLEEPER USERS AND LEAGUE USERS HISTORY...');
    const leagueUsers = await buildLeagueUsersHistory();
    const leagueUsersIds = leagueUsers.map(u => u.userId);

    console.log('POPULATING SLEEPER USERS...');
    await buildAndInsertSleeperUsersHistory(leagueUsersIds);
    console.log('SLEEPER USERS POPULATED!');

    console.log('POPULATING LEAGUE USERS...');
    await buildAndInsertLeagueUserHistory(leagueUsers);
    console.log('LEAGUE USERS POPULATED!');

    console.log('POPULATING NFL PLAYERS...');
    await buildAndInsertNFLPlayers();
    console.log('NFL PLAYERS POPULATED!');

    respondWithJSON(res, 200, { message: "BOOTSTRAP COMPLETE!" });
}
