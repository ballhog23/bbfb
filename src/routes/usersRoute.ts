import express from "express";
import { asyncHandler } from "../lib/helpers.js";
import {
    handlerGetUsers, handlerGetUser,
    handlerDeleteUsers, handlerSyncActiveUsers,
    handlerInsertHistoricalUsers,
} from '../api/users.js';

export const usersRoute = express.Router();

usersRoute.get('/', asyncHandler(handlerGetUsers));
usersRoute.get('/:userId', asyncHandler(handlerGetUser));
usersRoute.put('/sync', asyncHandler(handlerSyncActiveUsers));
usersRoute.post('/populate-history', asyncHandler(handlerInsertHistoricalUsers));
usersRoute.delete('/', asyncHandler(handlerDeleteUsers));