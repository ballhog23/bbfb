import type { SelectLeagueUser, StrictInsertLeagueUser } from "../../db/schema.js";
import { Sleeper } from "../../lib/sleeper.js";
import {
    strictLeagueUserSchema, type RawLeagueUser,
    NullableRawLeagueUser, StrictLeagueUser
} from '../../lib/zod.js';
import { config } from "../../config.js";
import { undefinedToNullDeep, normalizeString } from "../../lib/helpers.js";
import { insertLeagueUser } from "../../db/queries/league-users.js";
import { selectAllLeagues } from "../../db/queries/leagues.js";

type RawLeagueUsersMap = {
    leagueId: string;
    leagueUsers: RawLeagueUser[];
};

type RawCurrentLeagueUsersMap = {
    leagueId: string;
    leagueUsers: RawLeagueUser[];
};

export async function syncLeagueUsers(currentLeagueUsers: StrictInsertLeagueUser[]) {
    return await insertLeagueUsers(currentLeagueUsers);
}

export async function buildAndInsertLeagueUserHistory(leagueUsers: StrictInsertLeagueUser[]) {
    return await insertLeagueUsers(leagueUsers);
}

export async function buildCurrentLeagueUsers(): Promise<StrictInsertLeagueUser[]> {
    const sleeper = new Sleeper();
    const currentLeagueId = config.league.id;
    const leagueUsers = await sleeper.getLeagueUsers(currentLeagueId);

    return rawToNormalizedLeagueUsers(
        [{ leagueId: currentLeagueId, leagueUsers } satisfies RawCurrentLeagueUsersMap]
    );
}

export async function insertLeagueUsers(leagueUsers: StrictInsertLeagueUser[]) {
    const successfulUsers: SelectLeagueUser[] = [];
    // sequential insert is fine, this number isn't too large in our league its 13 total users (historical)
    // per season our league is 12 player
    for (const leagueUser of leagueUsers) {
        const result = await insertLeagueUser(leagueUser);
        successfulUsers.push(result);
    }

    return successfulUsers;
}

export async function buildLeagueUsersHistory() {
    const leagueHistoryIds = (await selectAllLeagues()).map((league) => league.leagueId);
    const rawUsersHistory = await getAllLeagueUsersHistory(leagueHistoryIds);
    return rawToNormalizedLeagueUsers(rawUsersHistory);
}

export async function getAllLeagueUsersHistory(leaguesIds: string[]): Promise<RawLeagueUsersMap[]> {
    const sleeper = new Sleeper();
    const usersByLeague = await Promise.all(leaguesIds.map(async leagueId =>
        ({ leagueId, leagueUsers: await sleeper.getLeagueUsers(leagueId) })
    ));

    return usersByLeague;
}

export function normalizeLeagueUser(rawUser: NullableRawLeagueUser, leagueId: string) {
    const teamName = rawUser.metadata?.team_name ? normalizeString(rawUser.metadata.team_name) : null;
    const avatarId = rawUser.metadata?.avatar ? normalizeString(rawUser.metadata.avatar) : null;

    return {
        userId: normalizeString(rawUser.user_id),
        leagueId: normalizeString(leagueId),
        teamName,
        avatarId,
        isOwner: rawUser.is_owner ?? false
    } satisfies StrictLeagueUser;
}

export function rawToNormalizedLeagueUsers(rawUsers: RawLeagueUsersMap[]) {
    return rawUsers.map(
        ({ leagueId, leagueUsers }) => ({
            leagueId,
            leagueUsers: leagueUsers.map(
                user => undefinedToNullDeep(user) as NullableRawLeagueUser
            )
        }))
        .flatMap(({ leagueId, leagueUsers }) => (
            leagueUsers.map(user => normalizeLeagueUser(user, leagueId))
        ))
        .map(user => strictLeagueUserSchema.parse(user));
}