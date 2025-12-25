import type { StrictLeagueUser } from "../lib/zod.js";
import { Sleeper } from "../lib/sleeper.js";
import { selectLeagueUsers } from "../db/queries/league-users.js";
import { syncSleeperUsers } from "./sleeper-users-service.js";
import { buildCurrentLeagueUsers, rawToNormalizedLeagueUsers, syncLeagueUsers } from "./league-users-service.js";
import { config } from "../config.js";

export async function syncUsers() {
    const sleeper = new Sleeper();
    const dbLeagueUsersIds = new Set((await selectLeagueUsers(config.league.id)).map(user => user.userId));
    const leagueUsers = rawToNormalizedLeagueUsers(await buildCurrentLeagueUsers(sleeper));
    const newSleeperUsers: string[] = leagueUsers
        .filter(user => !dbLeagueUsersIds.has(user.userId))
        .map(user => user.userId);

    if (newSleeperUsers.length > 0) {
        // insert new sleeper users
    }
    // we really should also sync the existing sleeper users...
    syncSleeperUsers();
    syncLeagueUsers();
}