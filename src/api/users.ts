import type { Request, Response } from "express";
import type { InsertLeagueUser } from "../db/schema.js";
import { Sleeper } from '../lib/sleeper.js';
import { respondWithJSON } from "../lib/json.js";
import { insertLeagueUser, selectAllLeagueUsers, dropAllLeagueUsers } from "../db/queries/users.js";



export async function handlerUsers(_: Request, res: Response) {
    const databaseInfo = await selectAllLeagueUsers();

    const data = {
        databaseInfo
    };

    respondWithJSON(res, 200, data);
}

export async function handlerUsersInsert(_: Request, res: Response) {
    const sleeper = new Sleeper();
    const users = await sleeper.getLeagueUsers();

    for (const user of users) {
        await insertLeagueUser(user);
    }

    respondWithJSON(res, 200, { message: 'updated users' });
}

export async function handlerUsersDelete(_: Request, res: Response) {
    await dropAllLeagueUsers();

    respondWithJSON(res, 200, 'deleted all users');
}