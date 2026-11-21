import { respondWithError } from "../lib/json.js";
export async function errorHandler(err, req, res, next) {
    if (!req.path.startsWith("/api/"))
        return next(err);
    const statusCode = err.statusCode ?? 500;
    const message = statusCode >= 500 ? "There was an issue on our end." : err.message;
    if (statusCode >= 500) {
        console.error(err.message);
    }
    respondWithError(res, statusCode, message);
}
