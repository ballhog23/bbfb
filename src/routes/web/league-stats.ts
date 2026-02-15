import express from "express";
import { asyncHandler } from "../../lib/helpers.js";
import { handlerServeLeagueStats } from "../../web/league-stats.js";

export const webLeagueStatsRoute = express.Router();

webLeagueStatsRoute.get('/', asyncHandler(handlerServeLeagueStats));
