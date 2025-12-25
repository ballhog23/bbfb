import type { Request, Response } from "express";
import { respondWithError, respondWithJSON } from "../lib/json.js";
import { syncLeague } from "../services/league-service.js";
import { NotFoundError } from "../lib/errors.js";


// working
export async function handlerSyncLeague(_: Request, res: Response) {
    const currentLeagueData = await syncLeague();

    const data = {
        currentLeagueData
    };

    respondWithJSON(res, 200, data);
}

export async function handlerSyncUsers(_: Request, res: Response) {
    // call syncUsers Orchestrator
}