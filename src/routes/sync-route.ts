import express from 'express';
import { asyncHandler } from "../lib/helpers.js";
import {
    handlerSyncLeague, handlerSyncUsers,
    handlerSyncNFLPlayers, handlerSyncRosters,
    handlerSyncMatchups
} from '../api/sync.js';


export const syncRoute = express.Router();

// working
syncRoute.put("/leagues", asyncHandler(handlerSyncLeague)); // 1 time per 60 mins

// working
syncRoute.put("/users", asyncHandler(handlerSyncUsers)); // 4 times per 60mins

// working
syncRoute.put('/players', asyncHandler(handlerSyncNFLPlayers)); // 1 time per 24hrs

syncRoute.put('/rosters', asyncHandler(handlerSyncRosters)); // 4 times per 60 mins

syncRoute.put('/matchups', asyncHandler(handlerSyncMatchups)); // 1 time per 24hrs ?