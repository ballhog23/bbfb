import { SelectLeagueUser, type StrictInsertLeagueUser } from "../db/schema.js";
import { selectAllLeagues, selectCurrentLeague } from "../db/queries/leagues.js";
import { selectAllLeagueUsers } from '../db/queries/league-users.js';
import { Sleeper } from "../lib/sleeper.js";
import { strictLeagueUserSchema, RawLeagueUser, NullableRawLeagueUser, StrictLeagueUser, rawLeagueUserSchema, NullableRawLeague } from '../lib/zod.js';
import { undefinedToNullDeep, normalizeString } from "../lib/helpers.js";

type RawLeagueUsersMap = {
    leagueId: string;
    leagueUsers: RawLeagueUser[];
};

export async function buildLeagueUsersHistory() {
    const leagueHistoryIds = (await selectAllLeagues()).map((league) => league.leagueId);
    const rawUsersHistory = await getAllLeagueUsers(leagueHistoryIds);

    return rawToNormalizedLeagueUsers(rawUsersHistory);
}

// extracts all league users by league id
export async function getAllLeagueUsers(leaguesIds: string[]): Promise<RawLeagueUsersMap[]> {
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
        isOwner: rawUser.is_owner ?? null
    } satisfies StrictLeagueUser;
}

export function rawToNormalizedLeagueUsers(rawUsers: RawLeagueUsersMap[]) {
    const nullableLeagueUsers = rawUsers.flatMap(({ leagueId, leagueUsers }) => ({
        leagueId,
        leagueUsers: leagueUsers.map(user => undefinedToNullDeep(user) as NullableRawLeagueUser)
    }));

    const normalizedLeagueUsers = nullableLeagueUsers.flatMap(({ leagueId, leagueUsers }) => (
        leagueUsers.map(user => normalizeLeagueUser(user, leagueId))
    ));

    return normalizedLeagueUsers.map(user => strictLeagueUserSchema.parse(user));
}

// syncs current season league users
export async function syncLeagueUsers() {

}