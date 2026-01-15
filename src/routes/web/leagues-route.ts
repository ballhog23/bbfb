import express from 'express';
import { asyncHandler } from "../../lib/helpers.js";
import { handlerGetLeague, handlerGetCurrentLeague } from "../../web/leagues.js";

export const leaguesRoute = express.Router();

leaguesRoute.get('/', asyncHandler(handlerGetCurrentLeague));
leaguesRoute.get('/:leagueId', asyncHandler(handlerGetLeague));