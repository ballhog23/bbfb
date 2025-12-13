import express from "express";
import { handlerGetUsers, handlerGetUser, handlerInsertUsers, handlerDeleteUsers } from '../api/users.js';

export const usersRoute = express.Router();

usersRoute.get('/', (req, res, next) => {
    Promise.resolve(handlerGetUsers(req, res)).catch(next);
});

usersRoute.get('/:userId', (req, res, next) => {
    Promise.resolve(handlerGetUser(req, res)).catch(next);
});

usersRoute.post('/', (req, res, next) => {
    Promise.resolve(handlerInsertUsers(req, res)).catch(next);
});

usersRoute.delete('/', (req, res, next) => {
    Promise.resolve(handlerDeleteUsers(req, res)).catch(next);
});