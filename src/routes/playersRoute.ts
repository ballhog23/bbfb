import express from 'express';
import { handlerGetPlayers, handlerGetPlayer, handlerInsertPlayers, handlerDeleteNFLPlayers } from '../api/players.js';

export const playersRoute = express.Router();

playersRoute.get('/players', (req, res, next) => {
    Promise.resolve(handlerGetPlayers(req, res)).catch(next);
});

playersRoute.get('/players/:playerId', (req, res, next) => {
    Promise.resolve(handlerGetPlayer(req, res)).catch(next);
});

playersRoute.post('/players', (req, res, next) => {
    Promise.resolve(handlerInsertPlayers(req, res)).catch(next);
});

playersRoute.delete('/players', (req, res, next) => {
    Promise.resolve(handlerDeleteNFLPlayers(req, res)).catch(next);
});