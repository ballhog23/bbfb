import express from "express";
import { asyncHandler } from "../../lib/helpers.js";
import { handlerServeLeagueStats, handlerServeLeagueStatsBySeason } from "../../web/league-stats.js";

export const webLeagueStatsRoute = express.Router();

webLeagueStatsRoute.get('/', asyncHandler(handlerServeLeagueStats));
webLeagueStatsRoute.get('/leagues/:leagueId', asyncHandler(handlerServeLeagueStatsBySeason));
