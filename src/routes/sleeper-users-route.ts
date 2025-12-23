import express from "express";
import { asyncHandler } from "../lib/helpers.js";
import {
    handlerInsertSleeperUsersHistory,
    handlerGetSleeperUser, handlerGetSleeperUsers,
    handlerSyncSleeperUser
} from "../api/sleeper-users.js";

export const sleeperUsersRoute = express.Router();

// working
sleeperUsersRoute.get('/', asyncHandler(handlerGetSleeperUsers));

// working
sleeperUsersRoute.get('/:userId', asyncHandler(handlerGetSleeperUser));


sleeperUsersRoute.put('/sync', asyncHandler(handlerSyncSleeperUser));

// working
sleeperUsersRoute.post('/populate-history', asyncHandler(handlerInsertSleeperUsersHistory));