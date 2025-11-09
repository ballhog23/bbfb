import type { Request, Response } from "express";
import { Sleeper } from '../lib/sleeper.js';

import { respondWithJSON } from "../lib/json.js";
import { insertNFLPlayers, selectAllNFLPlayers } from "../db/queries/players.js";

export async function handlerInsertPlayers(_: Request, res: Response) {
    const sleeper = new Sleeper();
    const players = await sleeper.getAllPlayers();
    await insertNFLPlayers(players);
    respondWithJSON(res, 200, 'players inserted');
}

export async function handlerPlayers(_: Request, res: Response) {
    const players = await selectAllNFLPlayers();
    const filteredTeam = players.filter(player => player.team === 'DAL');


    respondWithJSON(res, 200, {
        filteredTeam,
        status: 'success'
    });
}