import { Request, Response } from "express";

export async function handlerServeNotFound(_: Request, res: Response) {
    return res.render('pages/404', {
        title: 'Page not found',
        page: 'not-found',
        description: `404 not resource not found`
    });
}