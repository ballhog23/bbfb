import type { Request, Response } from "express";
import { insertSleeperUser, dropAllSleeperUsers, selectAllSleeperUsers, selectSleeperUser } from "../db/queries/sleeperUsers.js";
import { buildSleeperUsersHistory, getAllSleeperUsers } from "../services/sleeperUsersService.js";
import { respondWithError, respondWithJSON } from "../lib/json.js";
import { NotFoundError } from "../lib/errors.js";

type SleeperUserParams = {
    userId: string;
};

type SleeperUsersBody = {
    leagueUsersIds: string[];
};

export async function handlerInsertSleeperUsers(req: Request<{}, {}, SleeperUsersBody>, res: Response) {
    const { leagueUsersIds } = req.body;

    if (!Array.isArray(leagueUsersIds)) {
        respondWithError(res, 400, `Expected Array, received ${typeof leagueUsersIds}`);
        return;
    }

    if (leagueUsersIds.length === 0) {
        respondWithError(res, 400, 'Array does not contain league user ids, 0 total.');
        return;
    }

    const sleeperUsers = await buildSleeperUsersHistory(leagueUsersIds);

    if (sleeperUsers.length === 0) {
        respondWithError(res, 409, "League history must be populated first. Sleeper users depend on league history.");
        return;
    }

    for (const user of sleeperUsers) {
        await insertSleeperUser(user);
    }

    respondWithJSON(res, 201, { message: 'updated sleeper users', sleeperUsers });
}

export async function handlerGetSleeperUsers(_: Request, res: Response) {
    const users = await selectAllSleeperUsers();

    if (users.length === 0) throw new NotFoundError(`No Sleeper Users found.`);

    const data = {
        users
    };

    respondWithJSON(res, 200, data);
}

export async function handlerGetSleeperUser(req: Request<SleeperUserParams>, res: Response) {
    const params = req.params;
    const user = await selectSleeperUser(params.userId);

    if (!user) throw new NotFoundError(`User with ID: ${params.userId} not found.`);

    const data = {
        user
    };

    respondWithJSON(res, 200, data);
}

export async function handlerDeleteSleeperUsers(_: Request, res: Response) {
    await dropAllSleeperUsers();

    respondWithJSON(res, 200, 'deleted all Sleeper users');
}