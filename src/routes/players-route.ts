import express from 'express';
import { asyncHandler } from "../lib/helpers.js";
import { handlerGetPlayers, handlerGetPlayer } from '../api/players.js';

export const playersRoute = express.Router();

playersRoute.get('/', asyncHandler(handlerGetPlayers));

playersRoute.get('/:playerId', asyncHandler(handlerGetPlayer));