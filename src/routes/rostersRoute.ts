import express from "express";
import { handlerGetRosters, handlerGetRoster, handlerInsertRosters } from '../api/rosters.js';

export const rostersRoute = express.Router();

rostersRoute.get('/rosters', (req, res, next) => {
    Promise.resolve(handlerGetRosters(req, res)).catch(next);
});

rostersRoute.get('/rosters/:rosterId', (req, res, next) => {
    Promise.resolve(handlerGetRoster(req, res)).catch(next);
});

rostersRoute.post('/rosters', (req, res, next) => {
    Promise.resolve(handlerInsertRosters(req, res)).catch(next);
});

rostersRoute.delete('/rosters', (req, res, next) => {
    Promise.resolve(handlerInsertRosters(req, res)).catch(next);
});

