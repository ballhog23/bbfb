import express from 'express';
import { asyncHandler } from "../lib/helpers.js";
import { handlerSyncLeague } from '../api/leagues.js';

export const syncRoute = express.Router();


syncRoute.put('/leagues', asyncHandler(handlerSyncLeague));