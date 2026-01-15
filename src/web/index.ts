import type { Request, Response } from "express";
import { selectLeagueWinner } from "../db/queries/playoffs.js";
import { config } from "../config.js";

export async function handlerRenderIndex(_: Request, res: Response) {
    const recentWinner = await selectLeagueWinner(config.league.id);
    res.render('index', { recentWinner });
}
