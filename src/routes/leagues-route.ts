import express from 'express';
import { asyncHandler } from "../lib/helpers.js";
import {
  handlerGetLeagues, handlerInsertLeagueHistory,
  handlerGetLeague
} from '../api/leagues.js';

export const leaguesRoute = express.Router();

// working
leaguesRoute.get('/', asyncHandler(handlerGetLeagues));

// working
leaguesRoute.get('/:leagueId', asyncHandler(handlerGetLeague));

// working
leaguesRoute.post('/populate-history', asyncHandler(handlerInsertLeagueHistory));