import type { RawBracketMatchup, RawLeague, RawLeagueUser, RawMatchup, RawNFLState, RawRoster, RawSleeperUser } from "../../../src/lib/zod.js";
import { http, HttpResponse } from 'msw';
import * as allLeagueUsersHistory from "../users/raw/raw-league-user-by-year.json";
import * as rawLeagueHistory from "../leagues/raw/league-history.json";
import * as rawSleeperUserFixture from "../users/raw/raw-sleeper-user.json";
import * as rawRostersFixture from "../rosters/raw/rosters.json";
import * as rawMatchupsFixture from "../matchups/raw/matchups.json";
import * as rawWinnersBracketFixture from "../playoffs/raw/winners-bracket.json";
import * as rawLosersBracketFixture from "../playoffs/raw/losers-bracket.json";
import * as rawNFLStateFixture from "../nfl-state/raw/nfl-state.json";
// import { config } from "../../../src/config.js";

const leagueHistory: RawLeague[] = Reflect.get(rawLeagueHistory, "default");
const usersByLeague: Map<string, RawLeagueUser[]> = new Map(
    Object.entries(Reflect.get(allLeagueUsersHistory, "default"))
);
const sleeperUser: RawSleeperUser = Reflect.get(rawSleeperUserFixture, "default");
const rosters: RawRoster[] = Reflect.get(rawRostersFixture, "default");
const matchups: RawMatchup[] = Reflect.get(rawMatchupsFixture, "default");
const winnersBracket: RawBracketMatchup[] = Reflect.get(rawWinnersBracketFixture, "default");
const losersBracket: RawBracketMatchup[] = Reflect.get(rawLosersBracketFixture, "default");
const nflState: RawNFLState = Reflect.get(rawNFLStateFixture, "default");
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
        const leagueId: string = Array.isArray(params.leagueId) ? params.leagueId[0] : params.leagueId ?? '1257436036187824128';
        const leagueUsers = usersByLeague.get(leagueId) ?? null;

        if (!leagueUsers) {
            return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json(leagueUsers);
    }),
    http.get(`${baseURL}league/:leagueId/rosters`, () => {
        return HttpResponse.json(rosters);
    }),
    http.get(`${baseURL}league/:leagueId/matchups/:week`, () => {
        return HttpResponse.json(matchups);
    }),
    http.get(`${baseURL}league/:leagueId/winners_bracket`, () => {
        return HttpResponse.json(winnersBracket);
    }),
    http.get(`${baseURL}league/:leagueId/losers_bracket`, () => {
        return HttpResponse.json(losersBracket);
    }),
    http.get(`${baseURL}user/:userId`, ({ params }) => {
        const { userId } = params;
        if (userId !== sleeperUser.user_id) {
            return new HttpResponse(null, { status: 404 });
        }
        return HttpResponse.json(sleeperUser);
    }),
    http.get(`${baseURL}state/nfl`, () => {
        return HttpResponse.json(nflState);
    }),
];
