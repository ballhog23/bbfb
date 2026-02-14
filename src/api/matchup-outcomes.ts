import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { BadRequestError } from "../lib/errors.js";
import {
    selectWeeklyLeagueMatchupOutcomes,
    selectLeagueRegularSeasonStats
} from "../db/queries/matchup-outcomes.js";

type MatchupOutcomesParams = {
    leagueId: string;
    week: string;
};

export async function handlerGetLeagueMatchupOutcomes(req: Request<MatchupOutcomesParams>, res: Response) {
    const params = req.params;
    const { leagueId } = params;
    if (!leagueId)
        throw new BadRequestError(`You must provide a League ID.`);

    const regularSeasonStandings = await selectLeagueRegularSeasonStats(leagueId);
    const data = {
        regularSeasonStandings
    };

    respondWithJSON(res, 200, data);
}

export async function handlerGetWeeklyMatchupOutcomes(req: Request<MatchupOutcomesParams>, res: Response) {
    const params = req.params;
    const { leagueId } = params;
    if (!leagueId)
        throw new BadRequestError(`You must provide a League ID.`);

    const week = Number(params.week);
    if (isNaN(week) || !Number.isInteger(week) || week <= 0 || week > 17)
        throw new BadRequestError('You must provide a valid week number. Ranging 1-17');

    const matchups = await selectWeeklyLeagueMatchupOutcomes(leagueId, week);

    const data = {
        matchups
    };

    respondWithJSON(res, 200, data);
}
