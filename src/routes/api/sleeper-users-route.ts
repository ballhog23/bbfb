import express from "express";
import { asyncHandler } from "../../lib/helpers.js";
import {
    handlerGetSleeperUser, handlerGetSleeperUsers,
} from "../../api/sleeper-users.js";

export const apiSleeperUsersRoute = express.Router();

// working
apiSleeperUsersRoute.get('/', asyncHandler(handlerGetSleeperUsers));

// working
apiSleeperUsersRoute.get('/:userId', asyncHandler(handlerGetSleeperUser));