export async function respondWithJSON(res, statusCode, payload) {
    res.set("Content-Type", "application/json");
    const body = JSON.stringify(payload);
    res.status(statusCode).send(body);
}
export async function respondWithError(res, statusCode, message) {
    respondWithJSON(res, statusCode, { error: message });
}
