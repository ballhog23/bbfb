import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import {
    selectLeagueMatchups, selectLeagueMatchupsByWeekWithoutByes,
    selectLeagueMatchupsByWeek, selectSpecificLeagueMatchup

} from "../db/queries/matchups.js";
import { BadRequestError } from "../lib/errors.js";
import { groupAdjacentMatchups } from "../lib/helpers.js";

type MatchupParams = {
    leagueId: string;
    week: string;
    matchupId: string;
};

export async function handlerGetLeagueMatchups(req: Request<MatchupParams>, res: Response) {
    const params = req.params;
    const { leagueId } = params;
    if (!leagueId)
        throw new BadRequestError('You must provide a League ID');

    const matchups = await selectLeagueMatchups(leagueId);
    if (matchups.length === 0)
        throw new BadRequestError(`No matchups found for League ID: ${leagueId}`);

    const data = {
        matchups
    };

    respondWithJSON(res, 200, data);
}

export async function handlerGetLeagueMatchupsByWeek(req: Request<MatchupParams>, res: Response) {
    const params = req.params;
    const { leagueId } = params;
    const week = Number(params.week);

    if (!leagueId)
        throw new BadRequestError('You must provide a League ID');

    if (isNaN(week) || !Number.isInteger(week) || week <= 0 || week > 17)
        throw new BadRequestError('You must provide a valid week, ranging 1-17');

    const ungroupedMatchups = await selectLeagueMatchupsByWeekWithoutByes(leagueId, week);
    if (ungroupedMatchups.length === 0)
        throw new BadRequestError(`No matchups found for League ID: ${leagueId} during Week: ${week}`);

    const matchups = groupAdjacentMatchups(ungroupedMatchups);
    const data = {
        matchups
    };

    respondWithJSON(res, 200, data);
}

export async function handlerGetSpecificLeagueMatchup(req: Request<MatchupParams>, res: Response) {
    const params = req.params;
    const { leagueId } = params;
    const week = Number(params.week);
    const matchupId = Number(params.matchupId);

    if (!leagueId)
        throw new BadRequestError('You must provide a League ID');

    if (isNaN(week) || !Number.isInteger(week) || week <= 0 || week > 17)
        throw new BadRequestError('You must provide a valid week number. Ranging 1-17');

    if (isNaN(matchupId) || !Number.isInteger(matchupId) || matchupId <= 0 || matchupId > 6)
        throw new BadRequestError('You must provide a valid matchup number. Ranging 1-6');

    const matchups = await selectSpecificLeagueMatchup(leagueId, week, matchupId);
    if (matchups.length === 0)
        throw new BadRequestError(
            `No matchups found for League ID: ${leagueId} during Week: ${week} with Matchup ID: ${matchupId}`
        );

    const data = {
        matchups
    };

    respondWithJSON(res, 200, data);
}