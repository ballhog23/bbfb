import type { Request, Response } from "express";
import { respondWithJSON } from "../lib/json.js";
import { bootstrapHistory } from "../db/queries/bootstrap.js";

export async function handlerHistoryBootstrap(_: Request, res: Response) {
    await bootstrapHistory();

    respondWithJSON(res, 200, { message: "BOOTSTRAP COMPLETE!" });
}
