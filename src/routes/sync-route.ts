import express from 'express';
import { asyncHandler } from "../lib/helpers.js";
import { handlerSyncLeague } from '../api/leagues.js';

export const syncRoute = express.Router();

// working
syncRoute.put("/leagues", asyncHandler(handlerSyncLeague));

// syncRoute.put("/users", asyncHandler(handlerSyncUsers));