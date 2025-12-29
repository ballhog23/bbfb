import { Sleeper } from "../lib/sleeper.js";
import {
    strictMatchupSchema,
    type RawMatchup, NullableRawMatchup, StrictMatchup
} from "../lib/zod.js";
import { undefinedToNullDeep, normalizeString } from "../lib/helpers.js";
import { buildLeagueHistoryMap, LeaguesMap } from "./roster-service.js";
import { StrictInsertMatchup } from "../db/schema.js";

type RawWeeklyMatchupRecord = {
    week: number,
    matchups: RawMatchup[];
};

type RawLeagueMatchups = {
    season: string,
    leagueId: string,
    allMatchupsPerWeek: RawWeeklyMatchupRecord[];
};


export async function getAllMatchupHistory(leaguesMap: LeaguesMap[]) {
    const sleeper = new Sleeper();
    const weeks = Array.from({ length: 17 }, (v, i) => i + 1);

    // for each leagueId/season, for each week fetch matchups
    const allMatchupsByLeague = await Promise.all(
        leaguesMap.map(async (leagueMap) => {
            const { leagueId, season } = leagueMap;

            return {
                season,
                leagueId,
                allMatchupsPerWeek: await Promise.all(
                    weeks.map(
                        async (week) => ({ week, matchups: await sleeper.getWeeklyLeagueMatchups(week, leagueId) })
                    )
                )
            } satisfies RawLeagueMatchups;
        })
    );

    return allMatchupsByLeague;
}

export async function buildLeagueMatchupHistory() {
    const leagueHistoryMap = await buildLeagueHistoryMap();
    const leagueMatchupsHistory = await getAllMatchupHistory(leagueHistoryMap);
    const normalizedLeagueMatchups: StrictMatchup[] = [];

    for (const leagueMatchupHistory of leagueMatchupsHistory) {
        const { season, leagueId, allMatchupsPerWeek } = leagueMatchupHistory;

        for (const weeklyMatchups of allMatchupsPerWeek) {
            const { week, matchups } = weeklyMatchups;

            normalizedLeagueMatchups.push(
                ...rawToNormalizedMatchups(matchups, season, week, leagueId)
            );
        }
    }

    return normalizedLeagueMatchups;
}

// needs work
export function rawToNormalizedMatchups(
    matchups: RawMatchup[],
    season: string,
    week: number,
    leagueId: string): StrictInsertMatchup[] {

    return matchups
        .map(matchup => undefinedToNullDeep(matchup) as NullableRawMatchup)
        .map(matchup => normalizeMatchup(matchup, season, week, leagueId))
        .map(matchup => strictMatchupSchema.parse(matchup));
}

// needs work
export function normalizeMatchup(
    matchup: NullableRawMatchup,
    season: string,
    week: number,
    leagueId: string,
) {
    // numeric type in postgres, is returned as string so insert as string?
    const points = matchup.points ? normalizeString(matchup.points.toFixed(2)) : '0';

    const playersPoints =
        typeof matchup.players_points === 'object' && matchup.players_points !== null ?
            Object.fromEntries(
                Object.entries(matchup.players_points).map(
                    ([key, value]) => ([normalizeString(key), normalizeString(value.toFixed(2))])
                )
            ) : null;

    return {
        leagueId,
        season,
        week,
        points,
        players: matchup.players,
        rosterId: matchup.roster_id,
        // null === bye week for roster owner
        matchupId: matchup.matchup_id ?? null,
        starters: matchup.starters,
        startersPoints: matchup.starters_points,
        playersPoints
    } satisfies StrictMatchup;
}