import express from 'express';
import { asyncHandler } from "../lib/helpers.js";
import {
  handlerGetLeagues, handlerInsertLeagueHistory,
  handlerGetLeague, handlerDeleteLeagues,
  handlerSyncLeague
} from '../api/leagues.js';

export const leaguesRoute = express.Router();

leaguesRoute.get('/', asyncHandler(handlerGetLeagues));

leaguesRoute.get('/:leagueId', asyncHandler(handlerGetLeague));

leaguesRoute.post('/populate-history', asyncHandler(handlerInsertLeagueHistory));

// leaguesRoute.put('/sync', asyncHandler(handlerSyncLeague));

leaguesRoute.delete('/', asyncHandler(handlerDeleteLeagues));