import express from "express";
import { asyncHandler } from "../../lib/helpers.js";
import { handlerServeChampionsHall } from "../../web/champions-hall.js";

export const webChampionsHallRoute = express.Router();

webChampionsHallRoute.get('/', asyncHandler(handlerServeChampionsHall));
