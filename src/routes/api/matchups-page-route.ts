import express from 'express';
import { asyncHandler } from "../../lib/helpers.js";
import { handlerApiMatchupsPage } from "../../api/matchups-page.js";

export const apiMatchupsPageRoute = express.Router();

apiMatchupsPageRoute.get('/leagues/:leagueId/weeks/:week', asyncHandler(handlerApiMatchupsPage));