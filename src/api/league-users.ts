import type { Request, Response } from "express";
import { respondWithError, respondWithJSON } from "../lib/json.js";
import {
    insertLeagueUser, selectLeagueUser,
    selectAllLeagueUsers, selectLeagueUsers
} from "../db/queries/league-users.js";
import { NotFoundError } from "../lib/errors.js";
import { StrictInsertLeagueUser } from "src/db/schema.js";

type LeagueUserParams = {
    userId: string;
    leagueId: string;
};

type LeagueUsersBody = {
    leagueUsers: StrictInsertLeagueUser[];
};

export async function handlerGetAllLeagueUsers(_: Request, res: Response) {
    const allUsers = await selectAllLeagueUsers();
    if (allUsers.length === 0) throw new NotFoundError('No users found.');

    const data = {
        allUsers
    };

    respondWithJSON(res, 200, data);
}

export async function handlerGetLeagueUsers(req: Request<LeagueUserParams>, res: Response) {
    const params = req.params;
    const { leagueId } = params;
    const allUsers = await selectLeagueUsers(leagueId);
    if (allUsers.length === 0) throw new NotFoundError(`No league users found for League ID: ${leagueId}.`);

    const data = {
        allUsers
    };

    respondWithJSON(res, 200, data);
}

export async function handlerGetLeagueUser(req: Request<LeagueUserParams>, res: Response) {
    const params = req.params;
    const { userId, leagueId } = params;
    const user = await selectLeagueUser(userId, leagueId);
    if (!user) throw new NotFoundError(`User with ID: ${userId} not found in League ID: ${leagueId}.`);

    const data = {
        user
    };

    respondWithJSON(res, 200, data);
}

export async function handlerInsertLeagueUsers(_: Request, res: Response) {



    respondWithJSON(res, 201, { message: 'updated league users' });
}