import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../sleeper-mocks/node.js";
import { Sleeper } from "../../../src/lib/sleeper.js";

const sleeper = new Sleeper();
const baseURL = `https://api.sleeper.app/v1/`;
const leagueId = "1118232706736807936";

// assertObject is used by: getLeague, getAllNFLPlayers, getSleeperUser, getNFLState
// assertArray is used by: getLeagueUsers, getLeagueRosters, getWeeklyLeagueMatchups, getLeaguePlayoffBracket

describe("Sleeper private assertObject", () => {
    it("throws when response is an array (getLeague)", async () => {
        server.use(
            http.get(`${baseURL}league/:leagueId`, () => HttpResponse.json([]), { once: true })
        );
        await expect(sleeper.getLeague(leagueId)).rejects.toThrow("Expected Object");
    });

    it("throws when response is null (getLeague)", async () => {
        server.use(
            http.get(`${baseURL}league/:leagueId`, () => HttpResponse.json(null), { once: true })
        );
        await expect(sleeper.getLeague(leagueId)).rejects.toThrow("Expected Object");
    });

    it("throws when response is a string (getNFLState)", async () => {
        server.use(
            http.get(`${baseURL}state/nfl`, () => HttpResponse.json("not an object"), { once: true })
        );
        await expect(sleeper.getNFLState()).rejects.toThrow("Expected Object");
    });
});

describe("Sleeper private assertArray", () => {
    it("throws when response is an object (getLeagueUsers)", async () => {
        server.use(
            http.get(`${baseURL}league/:leagueId/users`, () => HttpResponse.json({ not: "array" }), { once: true })
        );
        await expect(sleeper.getLeagueUsers(leagueId)).rejects.toThrow("Expected Array");
    });

    it("throws when response is null (getLeagueRosters)", async () => {
        server.use(
            http.get(`${baseURL}league/:leagueId/rosters`, () => HttpResponse.json(null), { once: true })
        );
        await expect(sleeper.getLeagueRosters(leagueId)).rejects.toThrow("Expected Array");
    });

    it("throws when response is a number (getWeeklyLeagueMatchups)", async () => {
        server.use(
            http.get(`${baseURL}league/:leagueId/matchups/:week`, () => HttpResponse.json(42), { once: true })
        );
        await expect(sleeper.getWeeklyLeagueMatchups(1, leagueId)).rejects.toThrow("Expected Array");
    });
});

describe("Sleeper HTTP error handling", () => {
    it("throws on non-ok HTTP response", async () => {
        server.use(
            http.get(`${baseURL}league/:leagueId`, () => new HttpResponse(null, { status: 500 }), { once: true })
        );
        await expect(sleeper.getLeague(leagueId)).rejects.toThrow("HTTP 500");
    });

    it("throws when content-type is not JSON", async () => {
        server.use(
            http.get(`${baseURL}league/:leagueId`, () =>
                new HttpResponse("<html>error</html>", {
                    status: 200,
                    headers: { "Content-Type": "text/html" },
                }),
                { once: true }
            )
        );
        await expect(sleeper.getLeague(leagueId)).rejects.toThrow("Expected JSON");
    });
});
