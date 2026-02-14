import express from "express";
import { asyncHandler } from "../../lib/helpers.js";
import { handlerServeTrophyRoom } from "../../web/trophyRoom.js";

export const webTrophyRoomRoute = express.Router();

webTrophyRoomRoute.get('/', asyncHandler(handlerServeTrophyRoom));
