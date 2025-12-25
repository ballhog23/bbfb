import express from 'express';
import { asyncHandler } from "../lib/helpers.js";
import {
    handlerGetPlayers, handlerGetPlayer,
    handlerInsertPlayers, handlerSyncPlayers
} from '../api/players.js';

export const playersRoute = express.Router();

playersRoute.get('/', asyncHandler(handlerGetPlayers));

playersRoute.get('/:playerId', asyncHandler(handlerGetPlayer));

// post used for initial insert of players to db ONLY
playersRoute.post('/populate-players', asyncHandler(handlerInsertPlayers));

// put used for syncing player data daily
playersRoute.put('/', asyncHandler(handlerSyncPlayers));