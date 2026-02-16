import express from 'express';
import { asyncHandler } from "../../lib/helpers.js";
import { handlerApiRivalryPage } from "../../api/rivalry-page.js";

export const apiRivalryPageRoute = express.Router();

apiRivalryPageRoute.get('/:userId1/:userId2', asyncHandler(handlerApiRivalryPage));