import express from 'express';
import { asyncHandler } from "../../lib/helpers.js";
import {
    handlerGetLeagueMatchupOutcomes,
    handlerGetWeeklyMatchupOutcomes

} from '../../api/matchup-outcomes.js';

export const apiMatchupOutcomesRoute = express.Router();

apiMatchupOutcomesRoute.get('/leagues/:leagueId', asyncHandler(handlerGetLeagueMatchupOutcomes));
apiMatchupOutcomesRoute.get('/leagues/:leagueId/weeks/:week', asyncHandler(handlerGetWeeklyMatchupOutcomes));