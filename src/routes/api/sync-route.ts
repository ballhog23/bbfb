import express from 'express';
import { asyncHandler } from "../../lib/helpers.js";
import {
    handlerSyncLeague, handlerSyncUsers,
    handlerSyncNFLPlayers, handlerSyncRosters,
    handlerSyncMatchups, handlerSyncLeagueState
} from '../../api/sync.js';


export const apiSyncRoute = express.Router();

apiSyncRoute.put("/leagues", asyncHandler(handlerSyncLeague)); // 1 time per 60 mins

apiSyncRoute.put("/users", asyncHandler(handlerSyncUsers)); // 4 times per 60mins

apiSyncRoute.put('/players', asyncHandler(handlerSyncNFLPlayers)); // 1 time per 24hrs

apiSyncRoute.put('/rosters', asyncHandler(handlerSyncRosters)); // 4 times per 60 mins

apiSyncRoute.put('/matchups', asyncHandler(handlerSyncMatchups)); // 1 time per 24hrs ?

apiSyncRoute.put('/league-state', asyncHandler(handlerSyncLeagueState)); // 1 time per 24 hrs