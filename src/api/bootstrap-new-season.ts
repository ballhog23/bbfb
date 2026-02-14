import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { syncLeague } from "../services/api/league-service.js";
import { syncUsers } from "../services/api/sync-users-service.js";
import { syncLeagueRosters } from "../services/api/roster-service.js";
import { syncRegularSeasonMatchups } from "../services/api/matchups-service.js";
import { syncLeagueState } from "../services/api/league-state-service.js";

export async function handlerNewSeasonBootstrap(_: Request, res: Response) {
    console.log('SYNCING LEAGUE STATE...');
    await syncLeagueState();
    console.log('LEAGUE STATE SYNCED!');

    console.log('SYNCING LEAGUE...');
    await syncLeague();
    console.log('LEAGUE SYNCED!');

    console.log('SYNCING USERS...');
    await syncUsers();
    console.log('USERS SYNCED!');

    console.log('SYNCING ROSTERS...');
    await syncLeagueRosters();
    console.log('ROSTERS SYNCED!');

    console.log('SYNCING REGULAR SEASON MATCHUPS...');
    await syncRegularSeasonMatchups();
    console.log('REGULAR SEASON MATCHUPS SYNCED!');

    respondWithJSON(res, 200, { message: "NEW SEASON BOOTSTRAP COMPLETE!" });
}
