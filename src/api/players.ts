import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { NotFoundError } from "../lib/errors.js";
import { dropAllNFLPlayers, insertNFLPlayer, selectAllNFLPlayers, selectNFLPlayer } from "../db/queries/players.js";
import { buildAllNFLPlayers } from "../services/playersService.js";

export async function handlerInsertPlayers(_: Request, res: Response) {
    const players = await buildAllNFLPlayers();

    for (const player of players) {
        await insertNFLPlayer(player);
    }

    respondWithJSON(res, 201, { status: 'players inserted, success' });
}

export async function handlerGetPlayers(_: Request, res: Response) {
    const players = await selectAllNFLPlayers();
    if (players.length === 0) throw new NotFoundError("No players found.");

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

export async function handlerDeleteNFLPlayers(_: Request, res: Response) {
    await dropAllNFLPlayers();

    respondWithJSON(res, 200, 'deleted all users');
}

export type PlayerParams = {
    playerId: string;
};