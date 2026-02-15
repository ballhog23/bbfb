import type { Request, Response } from "express";
import { assembleTrophyRoomPageData } from "../services/web/trophy-room-service.js";

export async function handlerServeTrophyRoom(_: Request, res: Response) {
    const champions = await assembleTrophyRoomPageData();

    return res.render('pages/trophy-room', {
        page: 'trophy-room',
        title: 'Trophy Room',
        description: 'Bleed Blue Fantasy Football Trophy Room',
        champions
    });
}
