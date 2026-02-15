import type { Request, Response } from "express";

export async function handlerServeRivalry(_: Request, res: Response) {
    return res.render('pages/rivalry', {
        page: 'rivalry',
        title: 'Rivalry',
        description: 'Bleed Blue Fantasy Football Rivalry'
    });
}
