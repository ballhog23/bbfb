import express from "express";
import { asyncHandler } from "../../lib/helpers.js";
import { handlerGetLeagueState } from "../../api/league-state.js";

export const apiLeagueStateRoute = express.Router();

apiLeagueStateRoute.get('/', asyncHandler(handlerGetLeagueState));