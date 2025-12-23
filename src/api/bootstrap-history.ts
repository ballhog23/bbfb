import type { Request, Response } from "express";
import { config } from "../config.js";
import { buildLeagueUsersHistory } from "../services/league-users-service.js";
import { respondWithError, respondWithJSON } from "../lib/json.js";

export async function handlerHistoryBootstrap(_: Request, res: Response) {
    const baseURL = `http://localhost:${config.api.port}`;

    try {
        console.log('POPULATING LEAGUES...');
        let response = await fetch(`${baseURL}/leagues/populate-history`, { method: "POST" });
        if (!response.ok) throw new Error(`Leagues POST failed: ${response.status}`);
        console.log('LEAGUES POPULATED!');

        console.log('BUILDING LEAGUE USERS HISTORY...');
        const leagueUsers = await buildLeagueUsersHistory();
        const leagueUsersIds = leagueUsers.map(u => u.userId);

        console.log('POPULATING SLEEPER USERS...');
        response = await fetch(`${baseURL}/sleeper-users/populate-history`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leagueUsersIds })
        });
        if (!response.ok) throw new Error(`Sleeper Users POST failed: ${response.status}`);
        console.log('SLEEPER USERS POPULATED!');

        console.log('POPULATING LEAGUE USERS...');
        response = await fetch(`${baseURL}/league-users/populate-history`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leagueUsers })
        });
        if (!response.ok) throw new Error(`League Users POST failed: ${response.status}`);
        console.log('LEAGUE USERS POPULATED!');

        respondWithJSON(res, 200, { message: "BOOTSTRAP COMPLETE!" });
    } catch (err) {
        console.error('BOOTSTRAP FAILED', err);
        respondWithError(res, 500, `Bootstrap failed: ${err instanceof Error ? err.message : err}`);
    }
}
