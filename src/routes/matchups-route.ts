import express from 'express';
import { asyncHandler } from "../lib/helpers.js";
import { handlerGetMatchups, handlerGetMatchup } from '../api/matchups.js';

export const matchupsRoute = express.Router();

matchupsRoute.get('/', asyncHandler(handlerGetMatchups));

matchupsRoute.get('/:matchupId', asyncHandler(handlerGetMatchup));