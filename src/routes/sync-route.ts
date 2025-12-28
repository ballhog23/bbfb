import express from 'express';
import { asyncHandler } from "../lib/helpers.js";
import {
    handlerSyncLeague, handlerSyncUsers,
    handlerSyncNFLPlayers
} from '../api/sync.js';

export const syncRoute = express.Router();

// working
syncRoute.put("/leagues", asyncHandler(handlerSyncLeague)); // 1 time per 60 mins

// working
syncRoute.put("/users", asyncHandler(handlerSyncUsers)); // 4 times per 60mins

// working
syncRoute.put('/players', asyncHandler(handlerSyncNFLPlayers)); // 1 every 24hrs