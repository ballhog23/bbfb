import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { buildAndInsertLeagueHistory } from "../services/league-service.js";
import { buildLeagueUsersHistory } from "../services/league-users-service.js";
import { buildAndInsertSleeperUsersHistory } from "../services/sleeper-users-service.js";
import { buildAndInsertLeagueUserHistory } from "../services/league-users-service.js";
import { buildAndInsertLeagueRostersHistory } from "../services/roster-service.js";
import { buildAndInsertLeagueMatchupHistory } from "../services/matchups-service.js";
import { buildAndInsertLeagueMatchupOutcomes } from "../services/matchups-outcomes-service.js";
import { buildAndInsertPlayoffBracketHistory } from "../services/playoffs-service.js";
import { syncNFLPlayers } from "../services/players-service.js";

export async function handlerHistoryBootstrap(_: Request, res: Response) {
    console.log('POPULATING LEAGUES TABLE...');
    await buildAndInsertLeagueHistory();
    console.log('LEAGUES TABLE POPULATED!');

    console.log('BUILDING SLEEPER USERS AND LEAGUE USERS HISTORY...');
    const leagueUsers = await buildLeagueUsersHistory();
    const leagueUsersIds = leagueUsers.map(u => u.userId);

    await buildAndInsertSleeperUsersHistory(leagueUsersIds);
    console.log('SLEEPER USERS TABLE POPULATED!');

    await buildAndInsertLeagueUserHistory(leagueUsers);
    console.log('LEAGUE USERS TABLE POPULATED!');

    console.log('POPULATING LEAGUE ROSTERS TABLE...');
    await buildAndInsertLeagueRostersHistory();
    console.log('LEAGUE ROSTERS TABLE POPULATED!');

    console.log('POPULATING LEAGUE MATCHUPS TABLE...');
    await buildAndInsertLeagueMatchupHistory();
    console.log('LEAGUE MATCHUPS TABLE POPULATED!');

    console.log('POPULATING LEAGUE MATCHUPS TABLE...');
    await buildAndInsertPlayoffBracketHistory();
    console.log('LEAGUE MATCHUPS TABLE POPULATED!');

    console.log('POPULATING LEAGUE PLAYOFFS TABLE...');
    await buildAndInsertLeagueMatchupOutcomes();
    console.log('LEAGUE PLAYOFFS TABLE POPULATED!');

    console.log('POPULATING NFL PLAYERS TABLE...');
    await syncNFLPlayers();
    console.log('NFL PLAYERS TABLE POPULATED!');

    respondWithJSON(res, 200, { message: "BOOTSTRAP COMPLETE!" });
}
