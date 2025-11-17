import type { Request, Response } from "express";
import { Sleeper } from '../lib/sleeper.js';

export async function handlerRosters(_: Request, res: Response) {
    const sleeper = new Sleeper();
    const rosters = await sleeper.getLeagueRosters();
    const data = {
        rosters
    };

    res.send(data);
}