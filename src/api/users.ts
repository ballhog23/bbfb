import type { Request, Response } from "express";
import { respondWithError, respondWithJSON } from "../lib/json.js";
import { buildLeagueUsersHistory, syncLeagueUsers } from "../services/usersService.js";
import { insertLeagueUser, selectLeagueUser, selectAllLeagueUsers, dropAllLeagueUsers } from "../db/queries/users.js";
import { NotFoundError } from "../lib/errors.js";

// working
export async function handlerGetUsers(_: Request, res: Response) {
    const allUsers = await selectAllLeagueUsers();
    if (allUsers.length === 0) throw new NotFoundError('No users found.');

    const data = {
        allUsers
    };

    respondWithJSON(res, 200, data);
}

// working
export async function handlerGetUser(req: Request<LeagueUserParams>, res: Response) {
    const params = req.params;
    const user = await selectLeagueUser(params.userId);
    if (!user) throw new NotFoundError(`User with ID: ${params.userId} not found.`);

    const data = {
        user
    };

    respondWithJSON(res, 200, data);
}

export async function handlerSyncActiveUsers(_: Request, res: Response) {
    const leagueUsers = await syncLeagueUsers();

    for (const user of leagueUsers) {
        await insertLeagueUser(user);
    }

    respondWithJSON(res, 200, { message: 'synced users with sleeper', leagueUsers });
}

// working
export async function handlerInsertHistoricalUsers(_: Request, res: Response) {
    const allLeagueUsers = await buildLeagueUsersHistory();

    if (allLeagueUsers.length === 0) {
        respondWithError(res, 409, "League history must be populated first. League users depend on league history.");
        return;
    }

    // for (const user of allLeagueUsers) {
    //     await insertLeagueUser(user);
    // }

    respondWithJSON(res, 201, { message: 'updated users', allLeagueUsers });
}

// working
export async function handlerDeleteUsers(_: Request, res: Response) {
    await dropAllLeagueUsers();

    respondWithJSON(res, 200, 'deleted all users');
}

export type LeagueUserParams = {
    userId: string;
};