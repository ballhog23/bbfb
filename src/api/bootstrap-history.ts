import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { buildAndInsertLeagueHistory } from "../services/league-service.js";
import { buildLeagueUsersHistory } from "../services/league-users-service.js";
import { buildAndInsertSleeperUsersHistory } from "../services/sleeper-users-service.js";
import { buildAndInsertLeagueUserHistory } from "../services/league-users-service.js";
import { buildAndInsertLeagueRostersHistory } from "../services/roster-service.js";
import { buildAndInsertLeagueMatchupHistory } from "../services/matchups-service.js";
import { syncNFLPlayers } from "../services/players-service.js";

export async function handlerHistoryBootstrap(_: Request, res: Response) {
    console.log('POPULATING LEAGUES...');
    await buildAndInsertLeagueHistory();
    console.log('LEAGUES POPULATED!');

    console.log('BUILDING SLEEPER USERS AND LEAGUE USERS HISTORY...');
    const leagueUsers = await buildLeagueUsersHistory();
    const leagueUsersIds = leagueUsers.map(u => u.userId);

    await buildAndInsertSleeperUsersHistory(leagueUsersIds);
    console.log('SLEEPER USERS POPULATED!');

    console.log('POPULATING LEAGUE USERS...');
    await buildAndInsertLeagueUserHistory(leagueUsers);
    console.log('LEAGUE USERS POPULATED!');

    console.log('POPULATING LEAGUE ROSTERS...');
    await buildAndInsertLeagueRostersHistory();
    console.log('LEAGUE ROSTERS POPULATED!');

    console.log('POPULATING LEAGUE MATCHUPS...');
    await buildAndInsertLeagueMatchupHistory();
    console.log('LEAGUE MATCHUPS POPULATED!');

    console.log('POPULATING NFL PLAYERS...');
    // best effort, not historical, doesn't need transaction, synced once every 24hrs
    await syncNFLPlayers();
    console.log('NFL PLAYERS POPULATED!');

    respondWithJSON(res, 200, { message: "BOOTSTRAP COMPLETE!" });
}
