import express from "express";
import { asyncHandler } from "../../lib/helpers.js";
import { handlerServeMatchups, handlerRedirectToMatchups } from "../../web/matchups.js";

export const webMatchupsRoute = express.Router();

webMatchupsRoute.get('/', asyncHandler(handlerRedirectToMatchups));
webMatchupsRoute.get('/leagues/:leagueId/weeks/:week', asyncHandler(handlerServeMatchups));