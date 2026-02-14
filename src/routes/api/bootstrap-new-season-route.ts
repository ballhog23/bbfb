import express from "express";
import { asyncHandler } from "../../lib/helpers.js";
import { handlerNewSeasonBootstrap } from "../../api/bootstrap-new-season.js";

export const apiBootstrapNewSeasonRoute = express.Router();

apiBootstrapNewSeasonRoute.post('/', asyncHandler(handlerNewSeasonBootstrap));
