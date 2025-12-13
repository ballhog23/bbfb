import { type InsertRoster } from "../db/schema.js";
import { Sleeper } from "../lib/sleeper.js";
import { buildLeagueUsersHistory } from "./usersService.js";
import { undefinedToNullDeep, normalizeString } from "../lib/helpers.js";

// rosters depend on a userId
export async function buildLeagueRosters() {
    const all = (await buildLeagueUsersHistory()).map(user => user.userId);

}