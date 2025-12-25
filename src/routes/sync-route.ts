import express from 'express';
import { asyncHandler } from "../lib/helpers.js";
import { handlerSyncLeague } from '../api/sync.js';
import { handlerSyncUsers } from "../api/sync.js";
import { handlerSyncPlayers } from "../api/players.js";

export const syncRoute = express.Router();

// working
syncRoute.put("/leagues", asyncHandler(handlerSyncLeague));

// working
syncRoute.put("/users", asyncHandler(handlerSyncUsers));

syncRoute.put('/players', asyncHandler(handlerSyncPlayers));