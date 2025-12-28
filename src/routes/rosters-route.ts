import express from "express";
import {
    handlerGetAllRosters, handlerGetLeagueRosters,
    handlerGetLeagueUserRoster, handlerGetLeagueUserRosters
} from '../api/rosters.js';
import { asyncHandler } from "../lib/helpers.js";

export const rostersRoute = express.Router();

rostersRoute.get('/', asyncHandler(handlerGetAllRosters));

rostersRoute.get('/users/:userId', asyncHandler(handlerGetLeagueUserRosters));

rostersRoute.get('/leagues/:leagueId', asyncHandler(handlerGetLeagueRosters));

rostersRoute.get('/leagues/:leagueId/users/:userId', asyncHandler(handlerGetLeagueUserRoster));


