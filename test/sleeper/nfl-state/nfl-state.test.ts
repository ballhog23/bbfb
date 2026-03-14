import { describe, expect, it } from "vitest";
import { Sleeper } from "../../../src/lib/sleeper.js";
import * as rawNFLStateFixture from "./raw/nfl-state.json";
import type { RawNFLState } from "../../../src/lib/zod.js";

const rawNFLState: RawNFLState = Reflect.get(rawNFLStateFixture, "default");
const sleeper = new Sleeper();

describe("Sleeper.getNFLState (MSW intercepted)", () => {
    it("returns NFL state", async () => {
        const result = await sleeper.getNFLState();
        expect(result).toEqual(rawNFLState);
    });

    it("has required fields", async () => {
        const result = await sleeper.getNFLState();
        expect(result).toHaveProperty("season");
        expect(result).toHaveProperty("season_type");
        expect(result).toHaveProperty("league_season");
        expect(typeof result.season_has_scores).toBe("boolean");
    });
});
