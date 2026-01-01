import { db } from "../index.js";
import { buildAndInsertLeagueHistory } from "../../services/league-service.js";
import { buildLeagueUsersHistory, buildAndInsertLeagueUserHistory } from "../../services/league-users-service.js";
import { buildAndInsertSleeperUsersHistory } from "../../services/sleeper-users-service.js";
import { buildAndInsertLeagueRostersHistory } from "../../services/roster-service.js";
import { buildAndInsertLeagueMatchupHistory } from "../../services/matchups-service.js";
import { syncNFLPlayers } from '../../services/players-service.js';

export async function bootstrapHistory() {
    return await db.transaction(
        async tx => {

            console.log('POPULATING LEAGUES...');
            await buildAndInsertLeagueHistory(tx);
            console.log('LEAGUES POPULATED!');

            console.log('BUILDING SLEEPER USERS AND LEAGUE USERS HISTORY...');
            const leagueUsers = await buildLeagueUsersHistory();
            const leagueUsersIds = leagueUsers.map(u => u.userId);

            console.log('POPULATING SLEEPER USERS...');
            await buildAndInsertSleeperUsersHistory(leagueUsersIds, tx);
            console.log('SLEEPER USERS POPULATED!');

            console.log('POPULATING LEAGUE USERS...');
            await buildAndInsertLeagueUserHistory(leagueUsers, tx);
            console.log('LEAGUE USERS POPULATED!');

            console.log('POPULATING LEAGUE ROSTERS...');
            await buildAndInsertLeagueRostersHistory(tx);
            console.log('LEAGUE ROSTERS POPULATED!');

            console.log('POPULATING LEAGUE MATCHUPS...');
            await buildAndInsertLeagueMatchupHistory(tx);
            console.log('LEAGUE MATCHUPS POPULATED!');

            console.log('POPULATING NFL PLAYERS...');
            // best effort, not historical, doesn't need transaction, synced once every 24hrs
            await syncNFLPlayers();
            console.log('NFL PLAYERS POPULATED!');
        }
    );
}