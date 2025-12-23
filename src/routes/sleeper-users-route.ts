import express from "express";
import { asyncHandler } from "../lib/helpers.js";
import {
    handlerInsertSleeperUsers, handlerDeleteSleeperUsers,
    handlerGetSleeperUser, handlerGetSleeperUsers
} from "../api/sleeper-users.js";

export const sleeperUsersRoute = express.Router();

sleeperUsersRoute.get('/', asyncHandler(handlerGetSleeperUsers));
sleeperUsersRoute.get('/:userId', asyncHandler(handlerGetSleeperUser));
// sleeperUsersRoute.put('/sync', asyncHandler());
sleeperUsersRoute.post('/populate-history', asyncHandler(handlerInsertSleeperUsers));
sleeperUsersRoute.delete('/', asyncHandler(handlerDeleteSleeperUsers));