import { respondWithJSON } from "../lib/json.js";
import { assembleRivalryPageData } from "../services/web/rivalry-service.js";
export async function handlerApiRivalryPage(req, res) {
    const data = await assembleRivalryPageData(req.params.userId1, req.params.userId2);
    respondWithJSON(res, 200, data);
}
