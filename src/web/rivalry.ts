import type { Request, Response } from "express";
import { buildDropDownTeams } from "../services/web/rivalry-service.js";

export async function handlerServeRivalry(_: Request, res: Response) {
    const teams = await buildDropDownTeams();

    return res.render('pages/rivalry', {
        page: 'rivalry',
        title: 'Rivalry',
        description: 'Bleed Blue Fantasy Football Rivalry',
        teams,
    });
}
