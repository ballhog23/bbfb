import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { syncLeague } from "../services/league-service.js";
import { syncUsers } from "../services/sync-users-service.js";
import { syncNFLPlayers } from "../services/players-service.js";


// working
export async function handlerSyncLeague(_: Request, res: Response) {
    const currentLeagueData = await syncLeague();

    const data = {
        currentLeagueData
    };

    respondWithJSON(res, 200, data);
}

export async function handlerSyncUsers(_: Request, res: Response) {
    const result = await syncUsers();

    const data = {
        result
    };

    respondWithJSON(res, 200, data);
}

export async function handlerSyncNFLPlayers(_: Request, res: Response) {
    const currentNFLPlayers = await syncNFLPlayers();

    const data = {
        currentNFLPlayers
    };

    respondWithJSON(res, 200, data);
}