import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { assembleMatchupsPageData } from "../services/web/matchups-page-service.js";

export type RilvaryPageParams = {
    userId1: string;
    userId2: string;
};

export async function handlerApiRivalryPage(req: Request<RilvaryPageParams>, res: Response) {
    const data = await assembleMatchupsPageData(
        req.params.userId1,
        req.params.userId2
    );

    respondWithJSON(res, 200, data);
}