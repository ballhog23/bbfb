import { selectAllLeagueUsers } from "../../db/queries/league-users.js";
import { syncSleeperUsers } from "./sleeper-users-service.js";
import { buildCurrentLeagueUsers, syncLeagueUsers } from "./league-users-service.js";

export async function syncUsers() {
    const dbLeagueUsersIds = (await selectAllLeagueUsers()).map(user => user.userId);
    const uniqueDbLeagueUserIds = new Set(dbLeagueUsersIds);
    const currentLeagueUsers = await buildCurrentLeagueUsers();
    const newSleeperUsersIds: string[] = currentLeagueUsers
        .filter(user => !uniqueDbLeagueUserIds.has(user.userId))
        .map(user => user.userId);

    const syncedSleeperUsers = await syncSleeperUsers([...dbLeagueUsersIds, ...newSleeperUsersIds]);
    const syncedLeagueUsers = await syncLeagueUsers(currentLeagueUsers);

    return { sleeperUsers: syncedSleeperUsers, leagueUsers: syncedLeagueUsers };
}