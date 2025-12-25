import express from 'express';
import { asyncHandler } from "../lib/helpers.js";
import {
  handlerGetLeagues, handlerGetLeague,
  handlerInsertLeague
} from '../api/leagues.js';

export const leaguesRoute = express.Router();

// working
leaguesRoute.get('/', asyncHandler(handlerGetLeagues));

// working
leaguesRoute.get('/:leagueId', asyncHandler(handlerGetLeague));

// working, used for initial insert on new league season and sync, no need to split between post and put for the same job
leaguesRoute.put('/', asyncHandler(handlerInsertLeague));