import express from "express";
import {
    handlerGetAllRosters, handlerGetLeagueRosters,
    handlerGetLeagueUserRoster, handlerGetLeagueUserRosters
} from '../../api/rosters.js';
import { asyncHandler } from "../../lib/helpers.js";

export const apiRostersRoute = express.Router();

apiRostersRoute.get('/', asyncHandler(handlerGetAllRosters));

apiRostersRoute.get('/users/:userId', asyncHandler(handlerGetLeagueUserRosters));

apiRostersRoute.get('/leagues/:leagueId', asyncHandler(handlerGetLeagueRosters));

apiRostersRoute.get('/leagues/:leagueId/users/:userId', asyncHandler(handlerGetLeagueUserRoster));


