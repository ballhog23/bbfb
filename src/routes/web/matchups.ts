import express from "express";
import { asyncHandler } from "../../lib/helpers.js";
import { handlerServeMatchupsPage, handlerRedirectToMatchups } from "../../web/matchups.js";

export const webMatchupsPageRoute = express.Router();

webMatchupsPageRoute.get('/', asyncHandler(handlerRedirectToMatchups));
webMatchupsPageRoute.get('/leagues/:leagueId/weeks/:week', asyncHandler(handlerServeMatchupsPage));