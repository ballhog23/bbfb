import express from 'express';
import { asyncHandler } from "../../lib/helpers.js";
import { handlerGetLeague, handlerGetCurrentLeague } from "../../web/leagues.js";
import { handlerGetMatchupsHTMX } from "../../web/htmx/matchups.js";

export const leaguesRoute = express.Router();

leaguesRoute.get('/', asyncHandler(handlerGetCurrentLeague));
leaguesRoute.get('/:leagueId/weeks/:week', asyncHandler(handlerGetLeague));
leaguesRoute.get('/htmx/matchups', asyncHandler(handlerGetMatchupsHTMX));