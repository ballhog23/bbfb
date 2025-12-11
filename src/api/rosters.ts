import type { Request, Response } from "express";
import { Sleeper } from '../lib/sleeper.js';
import { selectAllLeagues } from "../db/queries/leagues.js";
import { insertAllLeagueRosters, selectAllRosters } from "../db/queries/rosters.js";
import { NotFoundError } from "../lib/errors.js";

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
// export async function handlerInsertRosters(_: Request, res: Response) {
//     const sleeper = new Sleeper();
//     const leagues = await selectAllLeagues();
//     const allRosters = await sleeper.getAllRosters(leagues);
//     const allRostersMap = allRosters.map(({ rosterId, ownerId, season, leagueId }) => ({ rosterId, ownerId, season, leagueId }));
//     // const insertedRosters = await insertAllLeagueRosters(allRosters);

//     const data = {
//         allRostersMap,
//         status: "ok"
//     };

//     res.send(data);
// }

export type RosterParams = {
    rosterId: string;
};