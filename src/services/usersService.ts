import { SelectLeagueUser, type StrictInsertLeagueUser } from "../db/schema.js";
import { selectAllLeagues, selectCurrentLeague } from "../db/queries/leagues.js";
import { selectAllLeagueUsers } from '../db/queries/users.js';
import { Sleeper } from "../lib/sleeper.js";
import { strictLeagueUserSchema, RawLeagueUser, NullableLeagueUser, StrictLeagueUser, rawLeagueUserSchema } from '../lib/zod.js';
import { undefinedToNullDeep, normalizeString } from "../lib/helpers.js";

// have to have all league ids to get all users. users depend on leagues.
// YOU MUST BUILD LEAGUE HISTORY FIRST, USERS DEPEND ON LEAGUE HISTORY
export async function buildLeagueUsersHistory() {
    const leagueHistory = (await selectAllLeagues()).map((league) => league.leagueId);
    const rawUsersHistory = await getAllLeagueUsers(leagueHistory);
    const normalizedUsers = rawToNormalizedUserData(rawUsersHistory);

    return normalizedUsers.map(user => strictLeagueUserSchema.parse(user));
}

async function getAllLeagueUsers(leaguesIds: string[]): Promise<RawLeagueUser[]> {
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

//  edge case may be if user roster is transferred, owner id is part of rosters ?
export async function syncLeagueUsers() {
    const sleeper = new Sleeper();
    const leagueId = (await selectCurrentLeague()).leagueId;
    const liveUsers = await sleeper.getLeagueUsers(leagueId);
    const dbUsers = await selectAllLeagueUsers();
    const { active, inactive } = determineActiveUsers(dbUsers, liveUsers);
    const fetchInactiveUsers = Array.from(inactive).map(async user => await sleeper.getSleeperUser(user));
    const fetchActiveUsers = Array.from(active).map(async user => await sleeper.getSleeperUser(user));
    const userPromises = [...fetchActiveUsers, ...fetchInactiveUsers];
    const rawUserData = await Promise.allSettled(userPromises);
    const fulfilledValues = rawUserData
        .filter(user => user.status === 'fulfilled')
        .map(user => user.value);
    const successfulUsers = rawToNormalizedUserData(fulfilledValues, active);
    // we could handle failed fetches with the inverse of above, by checking for 'rejected'
    // truly the only piece of data that matters the most is the user id,
    // anything else can just be retried on the next sync call... for now we will be simple

    return successfulUsers;
}

function determineActiveUsers(dbUsers: SelectLeagueUser[], liveUsers: RawLeagueUser[]): LeagueUserStatus {
    const dbIds = new Set(dbUsers.map(user => user.userId));
    const liveIds = new Set(liveUsers.map(user => user.user_id));

    if (!liveIds.size) {
        throw new Error('Live league users empty — aborting sync');
    }

    const needsInsert = liveIds.difference(dbIds);
    // active = all live users (existing + newly inserted)
    const needsActive = liveIds.intersection(dbIds).union(needsInsert);
    const needsInactive = dbIds.difference(liveIds);

    return {
        active: needsActive,
        inactive: needsInactive
    };
}

type LeagueUserStatus = {
    active: Set<string>,
    inactive: Set<string>;
};

export function rawToNormalizedUserData(rawUsers: RawLeagueUser[], activeUserIds?: Set<string>) {
    const rawUsersParsed = rawUsers.map(user => rawLeagueUserSchema.parse(user));
    const nullableLeagueUsers = rawUsersParsed.map(
        user => undefinedToNullDeep(user) as NullableLeagueUser
    );
    const normalizedLeagueUsers = nullableLeagueUsers.map(user => {
        const userId = normalizeString(user.user_id);
        const teamName = user.metadata?.team_name ? normalizeString(user.metadata.team_name) : null;

        return {
            displayName: normalizeString(user.display_name),
            userId,
            avatarId: normalizeString(user.avatar),
            isActive: activeUserIds?.has(userId) ? true : false,
            teamName,
        } satisfies StrictLeagueUser;
    });

    return normalizedLeagueUsers.map(user => strictLeagueUserSchema.parse(user));
}