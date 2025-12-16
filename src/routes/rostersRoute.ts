import express from "express";
import {
    handlerGetRosters, handlerGetRoster,
    handlerInsertHistoricalRosters, handlerDeleteRosters
} from '../api/rosters.js';
import { asyncHandler } from "../lib/helpers.js";

export const rostersRoute = express.Router();

rostersRoute.get('/', asyncHandler(handlerGetRosters));

rostersRoute.get('/:rosterId', asyncHandler(handlerGetRoster));

rostersRoute.post('/populate-roster-history', asyncHandler(handlerInsertHistoricalRosters));
// we need put for sync
rostersRoute.delete('/', asyncHandler(handlerDeleteRosters));

