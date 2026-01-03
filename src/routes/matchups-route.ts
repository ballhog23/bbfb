import express from 'express';
import { asyncHandler } from "../lib/helpers.js";
import {
    handlerGetAllMatchupsHistory, handlerGetLeagueMatchups,
    handlerGetLeagueMatchupsByWeek, handlerGetSpecificLeagueMatchup
} from '../api/matchups.js';

export const matchupsRoute = express.Router();

matchupsRoute.get('/', asyncHandler(handlerGetAllMatchupsHistory));

matchupsRoute.get('/leagues/:leagueId', asyncHandler(handlerGetLeagueMatchups));

matchupsRoute.get('/leagues/:leagueId/weeks/:week', asyncHandler(handlerGetLeagueMatchupsByWeek));

matchupsRoute.get('/leagues/:leagueId/weeks/:week/matchups/:matchupId', asyncHandler(handlerGetSpecificLeagueMatchup));