import express from 'express';
import { asyncHandler } from "../../lib/helpers.js";
import { handlerApiMatchupsPage } from "../../api/league-stats-page.js";

export const apiStatsPageRoute = express.Router();

apiStatsPageRoute.get('/:leagueId', asyncHandler(handlerApiMatchupsPage));