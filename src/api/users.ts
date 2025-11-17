import type { Request, Response } from "express";
import { Sleeper } from '../lib/sleeper.js';

export async function handlerUsers(_: Request, res: Response) {
    const sleeper = new Sleeper();
    const users = await sleeper.getLeagueUsers();
    const data = {
        users
    };

    res.send(data);
}