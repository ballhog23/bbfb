import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { assembleRivalryPageData } from "../services/web/rivalry-service.js";

export type RilvaryPageParams = {
    userId1: string;
    userId2: string;
};

export async function handlerApiRivalryPage(req: Request<RilvaryPageParams>, res: Response) {
    const data = await assembleRivalryPageData(
        req.params.userId1,
        req.params.userId2
    );
    console.log(data);
    respondWithJSON(res, 200, data);
}