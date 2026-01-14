import type { Request, Response } from "express";
import {
    selectAllLeagueUsers,
} from "../db/queries/league-users.js";
import { NotFoundError } from "../lib/errors.js";

export async function handlerRenderIndex(_: Request, res: Response) {
    res.render('index');
}
