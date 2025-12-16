import { SelectLeagueUser, type StrictInsertLeagueUser } from "../db/schema.js";
import { selectAllLeagues, selectCurrentLeague } from "../db/queries/leagues.js";
import { selectAllLeagueUsers } from '../db/queries/users.js';
import { Sleeper } from "../lib/sleeper.js";
import { strictLeagueUserSchema, RawLeagueUser, NullableRawLeagueUser, StrictLeagueUser, rawLeagueUserSchema, NullableRawLeague } from '../lib/zod.js';
import { undefinedToNullDeep, normalizeString } from "../lib/helpers.js";

// have to have all league ids to get all users. users depend on leagues.
// YOU MUST BUILD LEAGUE HISTORY FIRST, USERS DEPEND ON LEAGUE HISTORY
export async function buildLeagueUsersHistory() {
    const leagueHistoryIds = (await selectAllLeagues()).map((league) => league.leagueId);
    const rawUsersHistory = await getAllLeagueUsers(leagueHistoryIds);

    return rawToNormalizedLeagueUser(rawUsersHistory);
}

// extracts unique league users spanning all leagues
export async function getAllLeagueUsers(leaguesIds: string[]) {
    const sleeper = new Sleeper();
    const usersSet: Set<string> = new Set();
    const usersByLeague = await Promise.all(
        leaguesIds.map(leagueId => sleeper.getLeagueUsers(leagueId))
    );
    const rawAllLeagueUsers: RawLeagueUser[] = usersByLeague.flat();
    const uniqueRawAllLeagueUsers: RawLeagueUser[] = [];

    for (const leagueUser of rawAllLeagueUsers) {
        if (!usersSet.has(leagueUser.user_id)) {
            usersSet.add(leagueUser.user_id);
            uniqueRawAllLeagueUsers.push(leagueUser);
        }
    }

    return uniqueRawAllLeagueUsers;
}

export async function syncLeagueUsers() {
    const sleeper = new Sleeper();
    // querying database here for active league, but config has hardcoded current league
    // need to figure out how to get active league without league id but i doubt its possible to look forward
    // starting from a specific league id, that's the only way i can think of making that happen right now
    const leagueId = (await selectCurrentLeague()).leagueId;
    const liveUsers = await sleeper.getLeagueUsers(leagueId);
    const dbUsers = await selectAllLeagueUsers();
    const { active, inactive } = determineActiveUsers(dbUsers, liveUsers);

    // we know it has passed loose zod validation based on successful sleeper api call
    // this is where things can be weird... we are using live data, that needs to be normalized eventually
    // at the same time we have to filter inactive users based on our database query
    // so we have to patch the db user to match shape of the RAW League user
    const activeUsers = liveUsers.filter(user => active.has(user.user_id));
    const inActiveUsers = dbUsers
        .filter(user => inactive.has(user.userId))
        .map(user => {
            // matching sleeper raw league user api type RawLeagueUser
            return {
                user_id: user.userId,
                display_name: user.displayName,
                metadata: {
                    team_name: user.teamName ?? null,
                },
                avatar: user.avatarId,
            };
        });

    const usersToSync = [...activeUsers, ...inActiveUsers];
    const normalizedUsers = rawToNormalizedLeagueUser(usersToSync, active);

    return normalizedUsers;
}

export function determineActiveUsers(dbUsers: SelectLeagueUser[], liveUsers: RawLeagueUser[]): LeagueUserStatus {
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

export function normalizeLeagueUser(rawUser: NullableRawLeagueUser, activeUserIds?: Set<string>) {
    const userId = normalizeString(rawUser.user_id);
    const teamName = rawUser.metadata?.team_name ? normalizeString(rawUser.metadata.team_name) : null;

    return {
        displayName: normalizeString(rawUser.display_name),
        userId,
        avatarId: normalizeString(rawUser.avatar),
        isActive: activeUserIds?.has(userId) ? true : false,
        teamName,
    } satisfies StrictLeagueUser;
}

export function rawToNormalizedLeagueUser(rawUsers: RawLeagueUser[], activeUserIds?: Set<string>) {
    const nullableLeagueUsers = rawUsers.map(
        user => undefinedToNullDeep(user) as NullableRawLeagueUser
    );
    const normalizedLeagueUsers = nullableLeagueUsers.map(
        user => normalizeLeagueUser(user, activeUserIds)
    );

    return normalizedLeagueUsers.map(user => strictLeagueUserSchema.parse(user));
}