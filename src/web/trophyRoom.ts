import type { Request, Response } from "express";

export async function handlerServeTrophyRoom(_: Request, res: Response) {
    return res.render('pages/trophy-room', {
        page: 'trophy-room',
        title: 'Trophy Room',
        description: 'Bleed Blue Fantasy Football Trophy Room'
    });
}
