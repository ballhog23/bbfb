import express from 'express';
import { asyncHandler } from "../../lib/helpers.js";
import {
  handlerGetLeagues, handlerGetLeague,
} from '../../api/leagues.js';

export const apiLeaguesRoute = express.Router();

// working
apiLeaguesRoute.get('/', asyncHandler(handlerGetLeagues));

// working
apiLeaguesRoute.get('/:leagueId', asyncHandler(handlerGetLeague));