import type { Request, Response } from "express";
import { Sleeper } from '../lib/sleeper.js';
import { respondWithJSON } from "../lib/json.js";
import { insertNFLPlayers, selectAllNFLPlayers, selectNFLPlayer } from "../db/queries/players.js";
import { NotFoundError } from "../lib/errors.js";

export async function handlerInsertPlayers(_: Request, res: Response) {
    const sleeper = new Sleeper();
    const players = await sleeper.getAllPlayers();
    await insertNFLPlayers(players);

    respondWithJSON(res, 201, { status: 'players inserted, success' });
}

export async function handlerGetPlayers(_: Request, res: Response) {
    const players = await selectAllNFLPlayers();
    const filteredTeam = players.sort((a, b) => {
        const teamA = a.team ?? "";
        const teamB = b.team ?? "";

        return teamA.localeCompare(teamB);
    });


    respondWithJSON(res, 200, {
        filteredTeam,
        status: 'success'
    });
}

export async function handlerGetPlayer(req: Request<PlayerParams>, res: Response) {
    const params = req.params;
    const player = await selectNFLPlayer(params.playerId);

    if (!player) throw new NotFoundError(`Player with ID: ${params.playerId} not found.`);

    respondWithJSON(res, 200, {
        player,
        status: 'success'
    });
}

export type PlayerParams = {
    playerId: string;
};