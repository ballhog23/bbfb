import express from "express";
import { asyncHandler } from "../../lib/helpers.js";
import { handlerServeSitemap } from "../../web/sitemap.js";

export const webSitemapRoute = express.Router();

webSitemapRoute.get('/', asyncHandler(handlerServeSitemap));
