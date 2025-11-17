import type { Request, Response } from "express";
import { Sleeper } from '../lib/sleeper.js';

export async function handlerPlayers(_: Request, res: Response) {
    const sleeper = new Sleeper();
    const players = await sleeper.getAllPlayers();
    const data = {
        players
    };

    res.send(data);
}