import express from "express";
import { asyncHandler } from "../lib/helpers.js";
import {
    handlerGetAllLeagueUsers, handlerGetLeagueUser,
    handlerGetLeagueUsers,
} from '../api/league-users.js';

export const leagueUsersRoute = express.Router();

// working
leagueUsersRoute.get('/', asyncHandler(handlerGetAllLeagueUsers));

// working
leagueUsersRoute.get('/:leagueId', asyncHandler(handlerGetLeagueUsers));

// working
leagueUsersRoute.get('/:leagueId/:userId', asyncHandler(handlerGetLeagueUser));