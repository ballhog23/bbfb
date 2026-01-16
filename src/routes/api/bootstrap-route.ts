import express from "express";
import { asyncHandler } from "../../lib/helpers.js";
import { handlerHistoryBootstrap } from "../../api/bootstrap-history.js";

export const apiBootstrapRoute = express.Router();

apiBootstrapRoute.post('/', asyncHandler(handlerHistoryBootstrap));