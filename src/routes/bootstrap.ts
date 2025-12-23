import express from "express";
import { asyncHandler } from "../lib/helpers.js";
import { handlerBootstrap } from "../api/bootstrap.js";

export const bootstrapRoute = express.Router();

bootstrapRoute.post('/', asyncHandler(handlerBootstrap));