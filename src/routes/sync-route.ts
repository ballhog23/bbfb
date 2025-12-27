import express from 'express';
import { asyncHandler } from "../lib/helpers.js";
import {
    handlerSyncLeague, handlerSyncUsers,
    handlerSyncNFLPlayers
} from '../api/sync.js';

export const syncRoute = express.Router();

// working
syncRoute.put("/leagues", asyncHandler(handlerSyncLeague));

// working
syncRoute.put("/users", asyncHandler(handlerSyncUsers));

// working
syncRoute.put('/players', asyncHandler(handlerSyncNFLPlayers));