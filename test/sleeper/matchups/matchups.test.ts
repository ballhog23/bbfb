import { describe, expect, it } from "vitest";
import { Sleeper } from "../../../src/lib/sleeper.js";
import * as rawMatchupsFixture from "./raw/matchups.json";
import type { RawMatchup } from "../../../src/lib/zod.js";

const rawMatchups: RawMatchup[] = Reflect.get(rawMatchupsFixture, "default");
const sleeper = new Sleeper();
const leagueId = "1118232706736807936";

describe("Sleeper.getWeeklyLeagueMatchups (MSW intercepted)", () => {
    it("returns all matchups for a given week", async () => {
        const result = await sleeper.getWeeklyLeagueMatchups(1, leagueId);
        expect(result).toEqual(rawMatchups);
    });

    it("each matchup has required fields", async () => {
        const result = await sleeper.getWeeklyLeagueMatchups(1, leagueId);
        for (const matchup of result) {
            expect(matchup).toHaveProperty("points");
            expect(matchup).toHaveProperty("roster_id");
            expect(Array.isArray(matchup.players)).toBe(true);
            expect(Array.isArray(matchup.starters)).toBe(true);
        }
    });
});
