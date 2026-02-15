import express from "express";
import { asyncHandler } from "../../lib/helpers.js";
import { handlerServeRivalry } from "../../web/rivalry.js";

export const webRivalryRoute = express.Router();

webRivalryRoute.get('/', asyncHandler(handlerServeRivalry));
