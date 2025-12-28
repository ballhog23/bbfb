import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import {
    selectAllRosters, selectLeagueRosters,
    selectUserRosters, selectLeagueUserRoster
} from "../db/queries/rosters.js";
import { BadRequestError, NotFoundError } from "../lib/errors.js";

// all history
export async function handlerGetAllRosters(_: Request, res: Response) {
    const rosters = await selectAllRosters();
    if (rosters.length === 0) throw new NotFoundError("No league rosters found.");

    const data = {
        rosters
    };

    respondWithJSON(res, 201, data);
}

// all history per user
export async function handlerGetLeagueUserRosters(req: Request<RosterParams>, res: Response) {
    const params = req.params;
    const { userId } = params;

    if (!userId)
        throw new BadRequestError('You must provide a user ID.');

    const rosters = await selectUserRosters(userId);

    if (rosters.length === 0)
        throw new NotFoundError(`Could not find rosters for User ID: ${userId}`);

    const data = {
        rosters
    };

    res.send(data);
}

// per season
export async function handlerGetLeagueRosters(req: Request<RosterParams>, res: Response) {
    const params = req.params;
    const { leagueId } = params;
    if (!leagueId)
        throw new BadRequestError("You must provide a League ID.");

    const rosters = await selectLeagueRosters(leagueId);
    if (rosters.length === 0) throw new NotFoundError(`Rosters for League ID: ${leagueId} not found.`);

    const data = {
        rosters
    };

    res.send(data);
}

// history per league, per user
export async function handlerGetLeagueUserRoster(req: Request<RosterParams>, res: Response) {
    const params = req.params;
    const { leagueId, userId } = params;

    if (!leagueId && !userId)
        throw new BadRequestError("You must provide a League ID and User ID");

    const rosters = await selectLeagueUserRoster(leagueId, userId);

    if (rosters.length === 0)
        throw new NotFoundError(`Roster for User ID: ${userId} not found in League ID: ${leagueId}`);

    const data = {
        rosters
    };

    res.send(data);
}

export type RosterParams = {
    leagueId: string;
    userId: string;
};