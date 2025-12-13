import express from 'express';
import { asyncHandler } from "../lib/helpers.js";
import { handlerGetLeagues, handlerInsertLeagues, handlerGetLeague, handlerDeleteLeagues } from '../api/leagues.js';

export const leaguesRoute = express.Router();

leaguesRoute.get('/', asyncHandler(handlerGetLeagues));

leaguesRoute.get('/:leagueId', asyncHandler(handlerGetLeague));

leaguesRoute.post('/', asyncHandler(handlerInsertLeagues));

leaguesRoute.delete('/', asyncHandler(handlerDeleteLeagues));