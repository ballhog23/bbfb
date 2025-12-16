import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { selectAllRosters, dropAllLeagueRosters, insertLeagueRoster } from "../db/queries/rosters.js";
import { NotFoundError } from "../lib/errors.js";
import { buildLeagueRostersHistory } from "../services/rosterService.js";

export async function handlerGetRosters(_: Request, res: Response) {
    const rosters = await selectAllRosters();
    if (rosters.length === 0) throw new NotFoundError("No league rosters found.");

    const data = {
        rosters
    };

    res.send(data);
}

export async function handlerGetRoster(req: Request<RosterParams>, res: Response) {
    const params = req.params;
    const roster = await selectAllRosters();
    if (roster.length === 0) throw new NotFoundError(`Roster with ID: ${params.rosterId} not found.`);

    const data = {
        roster
    };

    res.send(data);
}

// this endpoint is currently treated as a first time insertion of data from sleeper
// current and present, its main function should solely be first time insertion of all data
// we should have another endpoint that maintains in season roster functionality
export async function handlerInsertHistoricalRosters(_: Request, res: Response) {
    const rosters = await buildLeagueRostersHistory();

    for (const roster of rosters) {
        await insertLeagueRoster(roster);
    }

    const data = {
        rosters,
        status: "ok"
    };

    res.send(data);
}

export async function handlerDeleteRosters(_: Request, res: Response) {
    await dropAllLeagueRosters();

    respondWithJSON(res, 200, 'deleted all league rosters');
}

export type RosterParams = {
    rosterId: string;
};