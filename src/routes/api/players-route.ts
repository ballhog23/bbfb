import express from 'express';
import { asyncHandler } from "../../lib/helpers.js";
import { handlerGetPlayers, handlerGetPlayer } from '../../api/players.js';

export const apiPlayersRoute = express.Router();

apiPlayersRoute.get('/', asyncHandler(handlerGetPlayers));

apiPlayersRoute.get('/:playerId', asyncHandler(handlerGetPlayer));