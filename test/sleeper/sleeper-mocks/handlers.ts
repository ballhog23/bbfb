import type { RawLeague, RawLeagueUser } from "../../../src/lib/zod.js";
import { http, HttpResponse } from 'msw';
import * as allLeagueUsersHistory from "../users/raw/raw-league-user-by-year.json";
import * as rawLeagueHistory from "../leagues/raw/league-history.json";
import { config } from "../../../src/config.js";

const leagueHistory: RawLeague[] = Reflect.get(rawLeagueHistory, "default");
const usersByLeague: Map<string, RawLeagueUser[]> = new Map(
    Object.entries(Reflect.get(allLeagueUsersHistory, "default"))
);
const baseURL = `https://api.sleeper.app/v1/`;

// https://vitest.dev/guide/mocking/requests.html
export const handlers = [
    http.get(`${baseURL}league/:leagueId`, ({ params }) => {
        const { leagueId } = params;
        const league = leagueHistory.find(league => league.league_id === leagueId);

        if (!league) {
            return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json(league);
    }),
    // all league users per league season
    http.get(`${baseURL}league/:leagueId/users`, ({ params }) => {
        const leagueId: string = Array.isArray(params.leagueId) ? params.leagueId[0] : params.leagueId ?? config.league.id;
        const leagueUsers = usersByLeague.get(leagueId) ?? null;

        if (!leagueUsers) {
            return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json(leagueUsers);
    }),
];
