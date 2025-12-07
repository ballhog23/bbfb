import type { Request, Response } from "express";
import { Sleeper } from '../lib/sleeper.js';
import { selectAllLeagues } from "../db/queries/leagues.js";

export async function handlerGetRosters(_: Request, res: Response) {
    const sleeper = new Sleeper();

    const data = {

    };

    res.send(data);
}

export async function handlerGetRoster(_: Request, res: Response) {
    const sleeper = new Sleeper();
    const data = {

    };

    res.send(data);
}

export async function handlerInsertRosters(_: Request, res: Response) {
    const sleeper = new Sleeper();
    const leagues = await selectAllLeagues();
    const allRosters = await sleeper.getAllRosters(leagues);
    console.log(allRosters);
    const data = {
        allRosters,
    };

    res.send(data);
}