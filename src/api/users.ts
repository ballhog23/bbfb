import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { buildLeagueUsersHistory } from "../services/usersService.js";
import { insertLeagueUser, selectLeagueUser, selectAllLeagueUsers, dropAllLeagueUsers } from "../db/queries/users.js";
import { NotFoundError } from "../lib/errors.js";

export async function handlerInsertUsers(_: Request, res: Response) {
    const allLeagueUsers = await buildLeagueUsersHistory();
    const returnedData = [];
    for (const user of allLeagueUsers) {
        returnedData.push(await insertLeagueUser(user));
    }

    respondWithJSON(res, 201, { message: 'updated users', returnedData });
}

export async function handlerGetUsers(_: Request, res: Response) {
    const allUsers = await selectAllLeagueUsers();
    if (allUsers.length === 0) throw new NotFoundError('No users found.');
    const data = {
        allUsers
    };

    respondWithJSON(res, 200, data);
}

export async function handlerGetUser(req: Request<LeagueUserParams>, res: Response) {
    const params = req.params;
    const user = await selectLeagueUser(params.userId);
    if (!user) throw new NotFoundError(`User with ID: ${params.userId} not found.`);

    const data = {
        user
    };

    respondWithJSON(res, 200, data);
}

export async function handlerDeleteUsers(_: Request, res: Response) {
    await dropAllLeagueUsers();

    respondWithJSON(res, 200, 'deleted all users');
}

export type LeagueUserParams = {
    userId: string;
};