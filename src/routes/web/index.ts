import express from "express";
import { asyncHandler } from "../../lib/helpers.js";
import { handlerServeIndex } from "../../web/index.js";

export const webIndexRoute = express.Router();

webIndexRoute.get('/', asyncHandler(handlerServeIndex));