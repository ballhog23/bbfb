import { Sleeper } from "../lib/sleeper.js";
import { } from "../lib/zod.js";
import { undefinedToNullDeep, normalizeString } from "../lib/helpers.js";

type WinnersBracket = 'winners_bracket';
type LosersBracket = 'losers_bracket';
type BracketTypes = [WinnersBracket, LosersBracket];

export async function buildPlayoffMatchups() {
    const sleeper = new Sleeper();
    const bracketTypes: BracketTypes = ['winners_bracket', 'losers_bracket'];
    const rawBrackets = await Promise.all(
        bracketTypes.map(
            async bracket => ({
                bracketType: bracket,
                theBracket: await sleeper.getLeaguePlayoffBracket(bracket)
            })
        ));

    return rawBrackets;
}