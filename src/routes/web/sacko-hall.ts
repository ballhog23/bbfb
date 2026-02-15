import express from "express";
import { asyncHandler } from "../../lib/helpers.js";
import { handlerServeSackoHall } from "../../web/sacko-hall.js";

export const webSackoHallRoute = express.Router();

webSackoHallRoute.get('/', asyncHandler(handlerServeSackoHall));
