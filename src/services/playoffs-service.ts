import { Sleeper } from "../lib/sleeper.js";
import {
    strictBracketMatchupSchema,
    type StrictBracketMatchup, NullableRawBracketMatchup,
    RawBracketMatchup
} from "../lib/zod.js";
import { selectPlayoffMatchups } from "../db/queries/matchup.js";
import { undefinedToNullDeep } from "../lib/helpers.js";
import { SelectPlayoffMatchup, StrictInsertPlayoffMatchup } from "src/db/schema.js";
import { insertPlayoffMatchup } from "src/db/queries/playoffs.js";

type WinnersBracket = 'winners_bracket';
type LosersBracket = 'losers_bracket';
type BracketTypesUnion = WinnersBracket | LosersBracket;
type BracketTypesArray = [WinnersBracket, LosersBracket];
type RawBracketWithMatchupId = RawBracketMatchup & { matchupId: number; };
type RawBracketMap = {
    leagueId: string;
    bracketType: BracketTypesUnion,
    bracketMatchups: RawBracketWithMatchupId[];
};
const bracketTypes: BracketTypesArray = ['winners_bracket', 'losers_bracket'];


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

async function getAllPlayoffBracketsHistory(): Promise<RawBracketMap[]> {
    const sleeper = new Sleeper();
    const playoffMatchups = await selectPlayoffMatchups();
    const leagueIds = Array.from(
        new Set(
            playoffMatchups.map(matchup => matchup.leagueId)
        )
    );
    const history = await Promise.all(
        leagueIds.map(async leagueId =>
            Promise.all(
                bracketTypes.map(async bracketType => {
                    const bracket = await sleeper.getLeaguePlayoffBracket(bracketType, leagueId);
                    // Map bracket 'matchupId' to matchupId from the matchups table in the db
                    const bracketMatchups: RawBracketWithMatchupId[] = bracket.map(matchup => {
                        // find the canonical matchupId
                        const matchedRow = playoffMatchups.find(
                            row =>
                                row.leagueId === leagueId &&
                                row.week === matchup.r + 14 // week 15-17 -> r=14+1,14+2,14+3 17 ends postseason
                        );


                        if (!matchedRow || matchedRow.matchupId == null) {
                            throw new Error(
                                `Could not match a playoff bracket matchup to a valid matchupId: leagueId=${leagueId}, round=${matchup.r}`
                            );
                        }

                        return {
                            ...matchup,
                            matchupId: matchedRow.matchupId,
                        };
                    });

                    return {
                        leagueId,
                        bracketType,
                        bracketMatchups
                    };
                })
            )
        )
    );

    return history.flat();
};

function normalizePlayoffBracketMatchup(
    matchup: NullableRawBracketMatchup,
    bracketType: BracketTypesUnion,
    leagueId: string
): StrictInsertPlayoffMatchup {
    return {
        leagueId,
        bracketType,
        bracketMatchupId: matchup.m,
        matchupId: matchup.matchupId,
        round: matchup.r,
        loserId: matchup.l ?? null,
        winnerId: matchup.w ?? null,
        place: matchup.p ?? null,
        t1: matchup.t1 ?? null,
        t2: matchup.t2 ?? null,
        t1From: matchup.t1_from ?? null,
        t2From: matchup.t2_from ?? null,
    } satisfies StrictInsertPlayoffMatchup;
}

function rawToNormalizedPlayoffBracketMatchups(bracketMaps: RawBracketMap[]): StrictInsertPlayoffMatchup[] {
    const matchups = bracketMaps.map(bracket => {
        const { bracketType, leagueId } = bracket;

        const normalized = bracket.bracketMatchups.map(
            matchup => undefinedToNullDeep(matchup) as NullableRawBracketMatchup
        );

        return normalized.map(
            matchup => normalizePlayoffBracketMatchup(matchup, bracketType, leagueId)
        );
    }).flat();

    return matchups.map(matchup => strictBracketMatchupSchema.parse(matchup));
}