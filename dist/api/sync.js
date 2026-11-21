import { respondWithJSON } from "../lib/json.js";
import { syncLeague } from "../services/api/league-service.js";
import { syncUsers } from "../services/api/sync-users-service.js";
import { syncNFLPlayers } from "../services/api/players-service.js";
import { syncLeagueRosters } from "../services/api/roster-service.js";
import { syncRegularSeasonMatchups, syncPostSeasonMatchups, } from "../services/api/matchups-service.js";
import { syncLeagueState } from "../services/api/league-state-service.js";
// working
export async function handlerSyncLeague(_, res) {
    const currentLeagueData = await syncLeague();
    const data = {
        currentLeagueData,
    };
    respondWithJSON(res, 200, data);
}
// working
export async function handlerSyncUsers(_, res) {
    const result = await syncUsers();
    const data = {
        result,
    };
    respondWithJSON(res, 200, data);
}
// working
export async function handlerSyncNFLPlayers(_, res) {
    const currentNFLPlayers = await syncNFLPlayers();
    const data = {
        currentNFLPlayers,
    };
    respondWithJSON(res, 200, data);
}
// working
export async function handlerSyncRosters(_, res) {
    const rosters = await syncLeagueRosters();
    const data = {
        rosters,
    };
    respondWithJSON(res, 200, data);
}
// working
export async function handlerSyncRegularSeasonMatchups(_, res) {
    const matchups = await syncRegularSeasonMatchups();
    const data = {
        matchups,
    };
    respondWithJSON(res, 200, data);
}
// working
export async function handlerSyncPostSeasonMatchups(_, res) {
    const matchups = await syncPostSeasonMatchups();
    const data = {
        matchups,
    };
    respondWithJSON(res, 200, data);
}
// working
export async function handlerSyncLeagueState(_, res) {
    const leagueState = await syncLeagueState();
    const data = {
        leagueState,
    };
    respondWithJSON(res, 200, data);
}
