import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { NotFoundError } from "../lib/errors.js";
import { selectAllNFLPlayers, selectNFLPlayer } from "../db/queries/players.js";

export type PlayerParams = {
    playerId: string;
};

// working
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

// working
export async function handlerGetPlayer(req: Request<PlayerParams>, res: Response) {
    const params = req.params;
    const player = await selectNFLPlayer(params.playerId);

    if (!player) throw new NotFoundError(`Player with ID: ${params.playerId} not found.`);

    respondWithJSON(res, 200, {
        player,
        status: 'success'
    });
}