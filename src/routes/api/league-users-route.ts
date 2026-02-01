import express from "express";
import { asyncHandler } from "../../lib/helpers.js";
import {
    handlerGetAllLeagueUsers, handlerGetLeagueUser,
    handlerGetLeagueUsers,
} from '../../api/league-users.js';

export const apiLeagueUsersRoute = express.Router();

// working
apiLeagueUsersRoute.get('/', asyncHandler(handlerGetAllLeagueUsers));

// working
apiLeagueUsersRoute.get('/:leagueId', asyncHandler(handlerGetLeagueUsers));

// working
apiLeagueUsersRoute.get('/:leagueId/:userId', asyncHandler(handlerGetLeagueUser));