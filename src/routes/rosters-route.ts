import express from "express";
import {
    handlerGetRosters, handlerGetRoster,
} from '../api/rosters.js';
import { asyncHandler } from "../lib/helpers.js";

export const rostersRoute = express.Router();

rostersRoute.get('/', asyncHandler(handlerGetRosters));

rostersRoute.get('/:rosterId', asyncHandler(handlerGetRoster));


