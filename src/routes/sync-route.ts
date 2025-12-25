import express from 'express';
import { asyncHandler } from "../lib/helpers.js";
import { handlerSyncLeague } from '../api/sync.js';
import { handlerSyncUsers } from "../api/sync.js";
export const syncRoute = express.Router();

// working
syncRoute.put("/leagues", asyncHandler(handlerSyncLeague));

syncRoute.put("/users", asyncHandler(handlerSyncUsers));