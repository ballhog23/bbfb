import express from 'express';
import { asyncHandler } from "../../lib/helpers.js";
import {
    handlerGetLeagueMatchupOutcomes,
    handlerGetWeeklyMatchupOutcomes

} from '../../api/matchup-outcomes.js';

export const matchupOutcomesRoute = express.Router();

matchupOutcomesRoute.get('/', asyncHandler(handlerGetLeagueMatchupOutcomes));
matchupOutcomesRoute.get('/leagues/:leagueId/weeks/:week', asyncHandler(handlerGetWeeklyMatchupOutcomes));