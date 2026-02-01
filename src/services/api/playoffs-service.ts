import { Sleeper } from "../../lib/sleeper.js";
import {
    strictBracketMatchupSchema,
    type NullableRawBracketMatchup, RawBracketMatchup,
    NullableTeamFromMatchup
} from "../../lib/zod.js";
import { selectPlayoffMatchups, type TempPlayoffMatchupRow } from "../../db/queries/matchups.js";
import { undefinedToNullDeep } from "../../lib/helpers.js";
import { SelectMatchup, SelectPlayoffMatchup, StrictInsertPlayoffMatchup } from "../../db/schema.js";
import { insertPlayoffMatchup } from "../../db/queries/playoffs.js";

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
const sleeper = new Sleeper();

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
    const playoffMatchups = await selectPlayoffMatchups(); // includes BYEs from DB
    const leagueIds = Array.from(new Set(playoffMatchups.map(m => m.leagueId)));

    const historicalBracketsRaw = await Promise.all(
        leagueIds.map(async (leagueId) =>
            Promise.all(
                bracketTypes.map(async (bracketType) => {
                    const bracketMatchups = await sleeper.getLeaguePlayoffBracket(bracketType, leagueId);

                    // First, map head-to-heads and assign matchupId from DB
                    const mappedMatchups: RawBracketWithMatchupId[] = bracketMatchups.map((matchup) => {
                        const week = 14 + matchup.r;

                        const dbRowsForWeek = playoffMatchups.filter(
                            row => row.leagueId === leagueId && row.week === week && !row.isBye
                        );

                        // Find matchupId from DB for this API matchup
                        const matchingMatchupIds = Array.from(
                            new Set(
                                dbRowsForWeek
                                    .filter(
                                        row =>
                                            row.homeTeam === matchup.t1 ||
                                            row.awayTeam === matchup.t1 ||
                                            row.homeTeam === matchup.t2 ||
                                            row.awayTeam === matchup.t2
                                    )
                                    .map(row => row.matchupId!)
                            )
                        );

                        let matchupId: number | null = null;
                        if (matchingMatchupIds.length === 1) {
                            matchupId = matchingMatchupIds[0];
                        } else if (matchingMatchupIds.length > 1) {
                            console.warn("Multiple matchupIds found for matchup:", matchup, matchingMatchupIds);
                            matchupId = matchingMatchupIds[0];
                        }

                        return {
                            m: matchup.m,
                            r: matchup.r,
                            t1: matchup.t1 ?? null,
                            t2: matchup.t2 ?? null,
                            t1_from: matchup.t1_from ?? null,
                            t2_from: matchup.t2_from ?? null,
                            w: matchup.w ?? null,
                            l: matchup.l ?? null,
                            p: matchup.p ?? null,
                            matchupId,
                            week,
                            isBye: false
                        } satisfies RawBracketWithMatchupId;
                    });

                    // Now derive BYEs from round 2 (or any r>1)
                    const byeMatchups: RawBracketWithMatchupId[] = [];
                    const round2 = mappedMatchups.filter(m => m.r === 2);

                    const existingRound1Teams = new Set(
                        mappedMatchups
                            .filter(m => m.r === 1)
                            .flatMap(m => [m.t1, m.t2].filter(Boolean) as number[])
                    );

                    round2.forEach(m => {
                        [m.t1, m.t2].forEach((team, idx) => {
                            if (!team) return;
                            const fromField = idx === 0 ? m.t1_from : m.t2_from;
                            if (!fromField) {
                                // team had no source matchup, so it had a BYE in round 1
                                if (!existingRound1Teams.has(team)) {
                                    byeMatchups.push({
                                        m: -(byeMatchups.length + 1),
                                        r: 1,
                                        t1: team,
                                        t2: null,
                                        t1_from: null,
                                        t2_from: null,
                                        w: null,
                                        l: null,
                                        p: null,
                                        matchupId: null,
                                        week: 15,
                                        isBye: true
                                    });
                                    existingRound1Teams.add(team); // avoid duplicate BYEs
                                }
                            }
                        });
                    });

                    return {
                        leagueId,
                        bracketType,
                        bracketMatchups: [...mappedMatchups, ...byeMatchups]
                    } satisfies RawBracketMap;
                })
            )
        )
    );

    return historicalBracketsRaw.flat().flat();
}

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