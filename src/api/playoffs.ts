import type { Request, Response } from "express";
import { selectPlayoffMatchupsPerSeason, selectPlayoffMatchupsWithDetails } from "../db/queries/playoffs.js";
import { respondWithJSON } from "../lib/json.js";
import { BadRequestError } from "../lib/errors.js";

type PlayoffBracketParams = {
    leagueId: string;
    week: number;
};

export async function handlerGetPlayoffBracket(req: Request<PlayoffBracketParams>, res: Response) {
    const params = req.params;
    const { leagueId } = params;
    if (!leagueId)
        throw new BadRequestError('You must provide a League ID');

    const matchups = await selectPlayoffMatchupsWithDetails(leagueId);

    const data = {
        matchups
    };

    respondWithJSON(res, 200, data);
}