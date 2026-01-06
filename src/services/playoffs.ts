import { Sleeper } from "../lib/sleeper.js";
import {
    strictBracketMatchupSchema, strictBracketMapSchema,
    type StrictBracketMatchup, NullableRawBracketMatchup,
    RawBracketMatchup, StrictBracketMap
} from "../lib/zod.js";
import { undefinedToNullDeep } from "../lib/helpers.js";

type WinnersBracket = 'winners_bracket';
type LosersBracket = 'losers_bracket';
type BracketTypesUnion = WinnersBracket | LosersBracket;
type BracketTypesArray = [WinnersBracket, LosersBracket];
type RawBracketMap = {
    bracketType: BracketTypesUnion,
    bracketMatchups: RawBracketMatchup[];
};

export async function buildPlayoffMatchups() {
    const sleeper = new Sleeper();
    const bracketTypes: BracketTypesArray = ['winners_bracket', 'losers_bracket'];
    const rawBrackets: RawBracketMap[] = await Promise.all(
        bracketTypes.map(
            async bracket => ({
                bracketType: bracket,
                bracketMatchups: await sleeper.getLeaguePlayoffBracket(bracket)
            })
        ));

    return rawToNormalizedPlayoffBrackets(rawBrackets);
}

function normalizePlayoffBracketMatchup(matchup: NullableRawBracketMatchup) {
    return {
        m: matchup.m,
        r: matchup.r,
        l: matchup.l ?? null,
        w: matchup.w ?? null,
        p: matchup.p ?? null,
        t1: matchup.t1 ?? null,
        t2: matchup.t2 ?? null,
        t1From: matchup.t1_from ?? null,
        t2From: matchup.t2_from ?? null,
    } satisfies StrictBracketMatchup;
}

function rawToNormalizedPlayoffBrackets(bracketMaps: RawBracketMap[]): StrictBracketMap[] {
    const normalized = bracketMaps.map(bracketMap => ({
        bracketType: bracketMap.bracketType,
        bracketMatchups: bracketMap.bracketMatchups
            .map(matchup => undefinedToNullDeep(matchup) as NullableRawBracketMatchup)
            .map(matchup => normalizePlayoffBracketMatchup(matchup))
            .map(matchup => strictBracketMatchupSchema.parse(matchup))
    }));

    return normalized.map(bracket => strictBracketMapSchema.parse(bracket));
}
