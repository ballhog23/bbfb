import { type InsertLeagueUser, InsertLeague } from "../db/schema.js";
import { Sleeper } from "../lib/sleeper.js";
import { nullableLeagueUserSchema, RawLeagueUser } from '../lib/zod.js';
import { buildLeagueHistory } from "./leagueService.js";
import { undefinedToNullDeep, normalizeString } from "../lib/helpers.js";
// we import buildLeagueHistory from the League Service because?
// have to have all league ids to get all users. users depend on leagues.

export async function buildLeagueUsersHistory() {
    const leagueHistory = (await buildLeagueHistory()).map((league) => league.leagueId);
    const rawUsersHistory = await getPreviousLeagueUsers(leagueHistory);
    const nullableLeagueUsers = undefinedToNullDeep(rawUsersHistory);
    const strictLeagueUsers = nullableLeagueUsers.map(user => nullableLeagueUserSchema.parse(user));

    return strictLeagueUsers.map(user => {
        const teamName = user.metadata.team_name ? normalizeString(user.metadata.team_name) : null;

        return {
            displayName: normalizeString(user.display_name),
            userId: normalizeString(user.user_id),
            avatarId: normalizeString(user.avatar),
            teamName
        } satisfies InsertLeagueUser;
    });
}

async function getPreviousLeagueUsers(previousLeaguesIds: InsertLeague["leagueId"][]): Promise<RawLeagueUser[]> {
    const sleeper = new Sleeper();
    const rawAllLeagueUsers: RawLeagueUser[] = [];
    const usersSet: Set<string> = new Set();

    for (const leagueId of previousLeaguesIds) {

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