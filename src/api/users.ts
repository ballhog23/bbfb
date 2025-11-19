import type { Request, Response } from "express";
import { Sleeper } from '../lib/sleeper.js';
import { respondWithJSON } from "../lib/json.js";

export async function handlerUsers(_: Request, res: Response) {
    const sleeper = new Sleeper();
    const users = await sleeper.getLeagueUsers();
    const data = {
        users
    };

    respondWithJSON(res, 200, data);
}