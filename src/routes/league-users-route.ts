import express from "express";
import { asyncHandler } from "../lib/helpers.js";
import {
    handlerGetAllLeagueUsers, handlerGetLeagueUser,
    handlerDeleteLeagueUsers, handlerGetLeagueUsers,
    handlerInsertLeagueUsers, // handlerSyncLeagueUsers
} from '../api/leagueUsers.js';

export const leagueUsersRoute = express.Router();
// all league users history
leagueUsersRoute.get('/', asyncHandler(handlerGetAllLeagueUsers));

// all league users from a specific league
leagueUsersRoute.get('/:leagueId', asyncHandler(handlerGetLeagueUsers));

// a single league user from a specific league
leagueUsersRoute.get('/:leagueId/:userId', asyncHandler(handlerGetLeagueUser));

// leagueUsersRoute.put('/sync', asyncHandler(handlerSyncLeagueUsers));

leagueUsersRoute.post('/populate-history', asyncHandler(handlerInsertLeagueUsers));

leagueUsersRoute.delete('/', asyncHandler(handlerDeleteLeagueUsers));