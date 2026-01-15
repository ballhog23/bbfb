import express from 'express';
import { asyncHandler } from "../../lib/helpers.js";
import {
    handlerGetLeagueMatchups,
    handlerGetLeagueMatchupsByWeek, handlerGetSpecificLeagueMatchup
} from '../../api/matchups.js';

export const apiMatchupsRoute = express.Router();

apiMatchupsRoute.get('/leagues/:leagueId', asyncHandler(handlerGetLeagueMatchups));

apiMatchupsRoute.get('/leagues/:leagueId/weeks/:week', asyncHandler(handlerGetLeagueMatchupsByWeek));

apiMatchupsRoute.get('/leagues/:leagueId/weeks/:week/matchups/:matchupId', asyncHandler(handlerGetSpecificLeagueMatchup));