import express from 'express';
import { asyncHandler } from "../../lib/helpers.js";
import { handlerRenderIndex } from "../../web/index.js";

export const indexRoute = express.Router();

indexRoute.get("/", asyncHandler(handlerRenderIndex));