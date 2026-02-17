import express from 'express';
import { asyncHandler } from "../../lib/helpers.js";
import { handlerApiAllTimeStats, handlerApiLeagueStatsPage } from "../../api/league-stats-page.js";

export const apiStatsPageRoute = express.Router();

apiStatsPageRoute.get('/all-time', asyncHandler(handlerApiAllTimeStats));
apiStatsPageRoute.get('/leagues/:leagueId', asyncHandler(handlerApiLeagueStatsPage));