import { respondWithJSON } from "../lib/json.js";
import { selectLeagueUser, selectAllLeagueUsers, selectLeagueUsers, } from "../db/queries/league-users.js";
import { NotFoundError } from "../lib/errors.js";
// working
export async function handlerGetAllLeagueUsers(_, res) {
    const allUsers = await selectAllLeagueUsers();
    if (allUsers.length === 0)
        throw new NotFoundError("No users found.");
    const data = {
        allUsers,
    };
    respondWithJSON(res, 200, data);
}
// working
export async function handlerGetLeagueUsers(req, res) {
    const params = req.params;
    const { leagueId } = params;
    const allUsers = await selectLeagueUsers(leagueId);
    if (allUsers.length === 0)
        throw new NotFoundError(`No league users found for League ID: ${leagueId}.`);
    const data = {
        allUsers,
    };
    respondWithJSON(res, 200, data);
}
// working
export async function handlerGetLeagueUser(req, res) {
    const params = req.params;
    const { userId, leagueId } = params;
    const user = await selectLeagueUser(userId, leagueId);
    if (!user)
        throw new NotFoundError(`User with ID: ${userId} not found in League ID: ${leagueId}.`);
    const data = {
        user,
    };
    respondWithJSON(res, 200, data);
}
