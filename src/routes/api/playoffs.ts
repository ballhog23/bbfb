import express from "express";
import { asyncHandler } from "../../lib/helpers.js";
import { handlerGetPlayoffBracket } from "../../api/playoffs.js";

export const apiPlayoffsRoute = express.Router();

apiPlayoffsRoute.get('/leagues/:leagueId', asyncHandler(handlerGetPlayoffBracket));