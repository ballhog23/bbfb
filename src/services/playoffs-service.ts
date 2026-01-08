import { Sleeper } from "../lib/sleeper.js";
import {
    strictBracketMatchupSchema,
    type NullableRawBracketMatchup, RawBracketMatchup,
    NullableTeamFromMatchup
} from "../lib/zod.js";
import { selectPlayoffMatchups } from "../db/queries/matchup.js";
import { undefinedToNullDeep } from "../lib/helpers.js";
import { SelectMatchup, SelectPlayoffMatchup, StrictInsertPlayoffMatchup } from "../db/schema.js";
import { insertPlayoffMatchup } from "../db/queries/playoffs.js";

type WinnersBracket = 'winners_bracket';
type LosersBracket = 'losers_bracket';
type BracketTypesUnion = WinnersBracket | LosersBracket;
type BracketTypesTuple = [WinnersBracket, LosersBracket];
type RawBracketWithMatchupId = RawBracketMatchup & {
    matchupId: number | null;
    week: number;
};
type RawBracketMap = {
    leagueId: string;
    bracketType: BracketTypesUnion,
    bracketMatchups: RawBracketMatchup[] | RawBracketWithMatchupId[];
};
const bracketTypes: BracketTypesTuple = ['winners_bracket', 'losers_bracket'];


export async function syncPlayoffMatchups() {
    // const sleeper = new Sleeper();
    // const rawBrackets: RawBracketMap[] = await Promise.all(
    //     bracketTypes.map(
    //         async bracket => ({
    //             bracketType: bracket,
    //             bracketMatchups: await sleeper.getLeaguePlayoffBracket(bracket)
    //         })
    //     ));

    // return rawToNormalizedPlayoffBrackets(rawBrackets);
}

async function insertPlayoffBracketMatchups(bracketMatchups: StrictInsertPlayoffMatchup[]) {
    const successfulMatchups: SelectPlayoffMatchup[] = [];
    const CHUNK_SIZE = 14;

    for (let i = 0; i < bracketMatchups.length; i += CHUNK_SIZE) {
        const chunk = bracketMatchups.slice(i, i + CHUNK_SIZE);
        const currentInsert = chunk.map(matchup => insertPlayoffMatchup(matchup));
        const result = (await Promise.all(currentInsert)).flat();
        successfulMatchups.push(...result);
    }

    return successfulMatchups;

}

export async function buildAndInsertPlayoffBracketHistory() {
    const matchups = await buildPlayoffBracketHistory();
    const result = await insertPlayoffBracketMatchups(matchups);
    return result;
}

async function buildPlayoffBracketHistory() {
    const playoffHistory = await getAllPlayoffBracketsHistory();
    const normalizedHistory = rawToNormalizedPlayoffBracketMatchups(playoffHistory);
    return normalizedHistory;
}

export async function getAllPlayoffBracketsHistory(): Promise<RawBracketMap[]> {
    const sleeper = new Sleeper();
    const playoffMatchups: SelectMatchup[] = await selectPlayoffMatchups();
    const leagueIds: string[] = Array.from(
        new Set(
            playoffMatchups.map(matchup => matchup.leagueId)
        )
    );
    const historicalBrackets = await Promise.all(
        leagueIds.map(async leagueId =>
            await Promise.all(
                bracketTypes.map(async bracketType => ({
                    leagueId,
                    bracketType,
                    bracketMatchups: await sleeper.getLeaguePlayoffBracket(bracketType, leagueId)
                } satisfies RawBracketMap))
            )
        )
    );
    // hashmap for lookup per season per week of matchup data
    const matchupsByLeagueAndWeek = new Map<string, Map<number, SelectMatchup[]>>();
    for (const matchup of playoffMatchups) {
        // set leagueId key if not exists
        if (!matchupsByLeagueAndWeek.has(matchup.leagueId)) {
            matchupsByLeagueAndWeek.set(matchup.leagueId, new Map<number, SelectMatchup[]>());
        }

        // insert matchups per league per week
        const weekMap = matchupsByLeagueAndWeek.get(matchup.leagueId);
        if (!weekMap?.has(matchup.week)) {
            weekMap?.set(matchup.week, []);
        }

        // find week key per league and insert matchup with matching week
        weekMap?.get(matchup.week)?.push(matchup);
    }

    const historicalBracketMap = historicalBrackets.flat().flatMap(bracket => {
        const { leagueId, bracketMatchups, bracketType } = bracket;

        const partiallyNormalizedMatchups = bracketMatchups.map(matchup => {
            const leagueMap = matchupsByLeagueAndWeek.get(leagueId);
            if (!leagueMap) throw new Error(`League ID: ${leagueId} does not exist.`);
            if (!matchup.r) throw new Error(`Sleeper did not send a round key indicating the round of the post-season playoff.`);
            const week = 14 + matchup.r; // matchup.round is 1, 2, or 3. post season starts week 15, 14+1,14+2,14+3
            const weekMap = leagueMap.get(week);
            if (!weekMap) throw new Error(`Week: ${week} does not exist.`);
            // now we can search through the week map for the matchup that has roster ids correlating to the sleeper response
            let t1: number | null = null;
            let t2: number | null = null;
            // we dont partially normalize for t1From and t2From because the normalizing function takes care of that
            let w: number | null = null;
            let l: number | null = null;
            let p: number | null = null;
            let matchupId: number | null = null;
            // if t1 and t2 are null we know its a round 17 'bye week'
            // really its just a league user who is not participating in a 1v1 matchup.
            // TS really wants me to continue to narrow for undefined not just null...
            if (matchup.t1 !== null && matchup.t2 !== null && matchup.t1 !== undefined && matchup.t2 !== undefined) {
                t1 = matchup.t1;
                t2 = matchup.t2;
                const dbMatchup = weekMap.find(element => t1 === element.rosterId && t2 === element.rosterId);
                matchupId = dbMatchup?.matchupId ?? null;
                w = matchup.w ?? null;
                l = matchup.l ?? null;
                p = matchup.p ?? null;
            } else if (matchup.t1 !== null && matchup.t1 !== undefined) {
                t1 = matchup.t1; const dbMatchup = weekMap.find(element => t1 === element.rosterId && t2 === element.rosterId);
                matchupId = dbMatchup?.matchupId ?? null;
                w = matchup.w ?? null;
                l = matchup.l ?? null;
                p = matchup.p ?? null;
            } else if (matchup.t2 !== null && matchup.t2 !== undefined) {
                t2 = matchup.t2; const dbMatchup = weekMap.find(element => t1 === element.rosterId && t2 === element.rosterId);
                matchupId = dbMatchup?.matchupId ?? null;
                w = matchup.w ?? null;
                l = matchup.l ?? null;
                p = matchup.p ?? null;
            }

            return {
                ...matchup,
                t1, t2, w, l, p, matchupId, week
            } satisfies RawBracketWithMatchupId;
        });

        // wrap back in RawBracketMap shape
        return {
            leagueId,
            bracketType,
            bracketMatchups: partiallyNormalizedMatchups
        } satisfies RawBracketMap;
    });

    return historicalBracketMap;
};

function normalizePlayoffBracketMatchup(
    matchup: NullableRawBracketMatchup,
    bracketType: BracketTypesUnion,
    leagueId: string
): StrictInsertPlayoffMatchup {
    const isWinner = (obj: NullableTeamFromMatchup): obj is { w: number; } => {
        return obj !== null && typeof obj.w === 'number' && 'w' in obj;
    };
    const isLoser = (obj: NullableTeamFromMatchup): obj is { l: number; } => {
        return obj !== null && typeof obj.l === 'number' && 'l' in obj;
    };
    let t1FromWinner = null;
    let t1FromLoser = null;
    let t2FromWinner = null;
    let t2FromLoser = null;
    if (matchup.t1_from && isWinner(matchup.t1_from)) t1FromWinner = matchup.t1_from.w;
    if (matchup.t1_from && isLoser(matchup.t1_from)) t1FromLoser = matchup.t1_from.l;
    if (matchup.t2_from && isWinner(matchup.t2_from)) t2FromWinner = matchup.t2_from.w;
    if (matchup.t2_from && isLoser(matchup.t2_from)) t2FromLoser = matchup.t2_from.l;


    return {
        leagueId,
        bracketType,
        bracketMatchupId: matchup.m,
        matchupId: matchup.matchupId,
        week: matchup.week,
        round: matchup.r,
        loserId: matchup.l ?? null,
        winnerId: matchup.w ?? null,
        place: matchup.p ?? null,
        t1: matchup.t1 ?? null,
        t2: matchup.t2 ?? null,
        t1FromWinner,
        t1FromLoser,
        t2FromWinner,
        t2FromLoser,
    } satisfies StrictInsertPlayoffMatchup;
}

function rawToNormalizedPlayoffBracketMatchups(bracketMaps: RawBracketMap[]): StrictInsertPlayoffMatchup[] {
    const matchups = bracketMaps.flatMap(bracket => {
        const { bracketType, leagueId } = bracket;

        const normalized = bracket.bracketMatchups.map(
            matchup => undefinedToNullDeep(matchup) as NullableRawBracketMatchup
        );

        return normalized.map(
            matchup => normalizePlayoffBracketMatchup(matchup, bracketType, leagueId)
        );
    });

    return matchups.map(matchup => strictBracketMatchupSchema.parse(matchup));
}