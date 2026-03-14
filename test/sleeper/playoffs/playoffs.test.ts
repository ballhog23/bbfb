import { describe, expect, it } from "vitest";
import { Sleeper } from "../../../src/lib/sleeper.js";
import * as rawWinnersBracketFixture from "./raw/winners-bracket.json";
import * as rawLosersBracketFixture from "./raw/losers-bracket.json";
import type { RawBracketMatchup } from "../../../src/lib/zod.js";

const rawWinnersBracket: RawBracketMatchup[] = Reflect.get(rawWinnersBracketFixture, "default");
const rawLosersBracket: RawBracketMatchup[] = Reflect.get(rawLosersBracketFixture, "default");
const sleeper = new Sleeper();
const leagueId = "1118232706736807936";

describe("Sleeper.getLeaguePlayoffBracket (MSW intercepted)", () => {
    it("returns the winners bracket", async () => {
        const result = await sleeper.getLeaguePlayoffBracket("winners_bracket", leagueId);
        expect(result).toEqual(rawWinnersBracket);
    });

    it("returns the losers bracket", async () => {
        const result = await sleeper.getLeaguePlayoffBracket("losers_bracket", leagueId);
        expect(result).toEqual(rawLosersBracket);
    });

    it("each bracket matchup has required fields", async () => {
        const result = await sleeper.getLeaguePlayoffBracket("winners_bracket", leagueId);
        for (const matchup of result) {
            expect(matchup).toHaveProperty("m");
            expect(matchup).toHaveProperty("r");
        }
    });
});
