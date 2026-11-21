try {
    process.loadEnvFile();
}
catch (error) {
    console.error("could not load env file", error);
}
export function envOrThrow(key) {
    // eslint-disable-next-line security/detect-object-injection
    const value = process.env[key];
    if (!value)
        throw new Error(`Env var ${key} is not set.`);
    return value;
}
export const config = {
    api: {
        platform: envOrThrow("PLATFORM"),
        port: Number(envOrThrow("PORT")),
    },
    league: {
        id: envOrThrow("LEAGUE_ID"),
        season: envOrThrow("LEAGUE_SEASON"),
        prevId: envOrThrow("PREV_LEAGUE_ID"),
        prevSeason: envOrThrow("PREV_LEAGUE_SEASON"),
    },
    db: {
        url: envOrThrow("DB_URL"),
    },
};
