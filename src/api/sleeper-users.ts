import type { Request, Response } from "express";
import { selectAllSleeperUsers, selectSleeperUser } from "../db/queries/sleeper-users.js";
import { respondWithJSON } from "../lib/json.js";
import { NotFoundError } from "../lib/errors.js";

type SleeperUserParams = {
    userId: string;
};

// working
export async function handlerGetSleeperUsers(_: Request, res: Response) {
    const users = await selectAllSleeperUsers();

    if (users.length === 0) throw new NotFoundError(`No Sleeper Users found.`);

    const data = {
        users
    };

    respondWithJSON(res, 200, data);
}

// working
export async function handlerGetSleeperUser(req: Request<SleeperUserParams>, res: Response) {
    const params = req.params;
    const user = await selectSleeperUser(params.userId);

    if (!user) throw new NotFoundError(`User with ID: ${params.userId} not found.`);

    const data = {
        user
    };

    respondWithJSON(res, 200, data);
}
