import { type StrictInsertLeagueUser, InsertLeague } from "../db/schema.js";
import { selectAllLeagues } from "../db/queries/leagues.js";
import { selectAllLeagueUsers } from '../db/queries/users.js';
import { Sleeper } from "../lib/sleeper.js";
import { strictLeagueUserSchema, RawLeagueUser } from '../lib/zod.js';
import { undefinedToNullDeep, normalizeString } from "../lib/helpers.js";
// we import buildLeagueHistory from the League Service because?
// have to have all league ids to get all users. users depend on leagues.

export async function buildLeagueUsersHistory() {
    const leagueHistory = (await selectAllLeagues()).map((league) => league.leagueId);
    const rawUsersHistory = await getAllLeagueUsers(leagueHistory);
    const nullableLeagueUsers = undefinedToNullDeep(rawUsersHistory);
    const normalizedLeagueUsers = nullableLeagueUsers.map(user => {
        const teamName = user.metadata.team_name ? normalizeString(user.metadata.team_name) : null;
        const isActive = false;

        return {
            displayName: normalizeString(user.display_name),
            userId: normalizeString(user.user_id),
            avatarId: normalizeString(user.avatar),
            teamName,
            isActive
        } satisfies StrictInsertLeagueUser;
    });

    return normalizedLeagueUsers.map(user => strictLeagueUserSchema.parse(user));
}

async function getAllLeagueUsers(leaguesIds: InsertLeague["leagueId"][]): Promise<RawLeagueUser[]> {
    const sleeper = new Sleeper();
    const rawAllLeagueUsers: RawLeagueUser[] = [];
    const usersSet: Set<string> = new Set();

    for (const leagueId of leaguesIds) {
        const leagueUsers = await sleeper.getLeagueUsers(leagueId);

        for (const leagueUser of leagueUsers) {

            if (!usersSet.has(leagueUser.user_id)) {
                usersSet.add(leagueUser.user_id);
                rawAllLeagueUsers.push(leagueUser);
            }
        }
    }

    return rawAllLeagueUsers;
}

export async function isLeagueUserActive() {
    const sleeper = new Sleeper();
    const allLeagueUsers = await selectAllLeagueUsers();
    const currentLeagueUsersIds = (await sleeper.getLeagueUsers()).map(user => user.user_id);
    const currentLeagueUsersSet = new Set(currentLeagueUsersIds);
    const updatedCurrentLeagueUserData: StrictInsertLeagueUser[] = [];

    for (const leagueUser of allLeagueUsers) {
        const { userId } = leagueUser;
        updatedCurrentLeagueUserData.push({
            ...leagueUser,
            isActive: currentLeagueUsersSet.has(userId)
        });
    }

    return updatedCurrentLeagueUserData;
}