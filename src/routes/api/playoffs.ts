import express from "express";
import { asyncHandler } from "../../lib/helpers.js";
import { handlerGetPlayoffBracket } from "../../api/playoffs.js";

export const playoffsRoute = express.Router();

playoffsRoute.get('/leagues/:leagueId', asyncHandler(handlerGetPlayoffBracket));