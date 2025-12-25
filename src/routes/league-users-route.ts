import express from "express";
import { asyncHandler } from "../lib/helpers.js";
import {
    handlerGetAllLeagueUsers, handlerGetLeagueUser,
    handlerGetLeagueUsers,
} from '../api/league-users.js';

export const leagueUsersRoute = express.Router();
// all league users history
leagueUsersRoute.get('/', asyncHandler(handlerGetAllLeagueUsers));

// all league users from a specific league
leagueUsersRoute.get('/:leagueId', asyncHandler(handlerGetLeagueUsers));

// a single league user from a specific league
leagueUsersRoute.get('/:leagueId/:userId', asyncHandler(handlerGetLeagueUser));

