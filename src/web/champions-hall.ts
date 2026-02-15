import type { Request, Response } from "express";
import { assembleChampionsHallPageData } from "../services/web/champions-hall-service.js";

export async function handlerServeChampionsHall(_: Request, res: Response) {
    const { champions, stats } = await assembleChampionsHallPageData();

    return res.render('pages/champions-hall', {
        page: 'champions-hall',
        title: 'Champions Hall',
        description: 'Bleed Blue Fantasy Football Champions Hall',
        champions,
        stats
    });
}
