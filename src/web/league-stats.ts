import type { Request, Response } from "express";

export async function handlerServeLeagueStats(_: Request, res: Response) {
    return res.render('pages/league-stats', {
        page: 'league-stats',
        title: 'League Stats',
        description: 'Bleed Blue Fantasy Football League Stats'
    });
}
