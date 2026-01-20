import express from "express";
import { asyncHandler } from "../../lib/helpers.js";
import { handlerServeMatchups } from "../../web/matchups.js";

export const webMatchupsRoute = express.Router();

webMatchupsRoute.get('/', asyncHandler(handlerServeMatchups));