import { describe, expect, it } from "vitest";
import { Sleeper } from "../../../src/lib/sleeper.js";
import * as rawRostersFixture from "./raw/rosters.json";
import type { RawRoster } from "../../../src/lib/zod.js";

const rawRosters: RawRoster[] = Reflect.get(rawRostersFixture, "default");
const sleeper = new Sleeper();
const leagueId = "1118232706736807936";

describe("Sleeper.getLeagueRosters (MSW intercepted)", () => {
    it("returns all rosters for a league", async () => {
        const result = await sleeper.getLeagueRosters(leagueId);
        expect(result).toEqual(rawRosters);
    });

    it("each roster has required fields", async () => {
        const result = await sleeper.getLeagueRosters(leagueId);
        for (const roster of result) {
            expect(roster).toHaveProperty("owner_id");
            expect(roster).toHaveProperty("league_id");
            expect(roster).toHaveProperty("roster_id");
            expect(Array.isArray(roster.players)).toBe(true);
            expect(Array.isArray(roster.starters)).toBe(true);
        }
    });
});
