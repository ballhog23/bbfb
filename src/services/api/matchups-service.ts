import { Sleeper } from "../../lib/sleeper.js";
import {
    strictMatchupSchema,
    type RawMatchup, NullableRawMatchup, StrictMatchup
} from "../../lib/zod.js";
import { undefinedToNullDeep, normalizeString } from "../../lib/helpers.js";
import { buildLeagueHistoryMap, type LeaguesMap } from "./roster-service.js";
import { insertMatchup } from "../../db/queries/matchups.js";
import { SelectMatchup, StrictInsertMatchup } from "../../db/schema.js";
import { config } from "../../config.js";

type RawWeeklyMatchupRecord = {
    week: number,
    matchups: RawMatchup[];
};

type RawLeagueMatchups = {
    season: string,
    leagueId: string,
    allMatchupsPerWeek: RawWeeklyMatchupRecord[];
};

export async function syncPostSeasonMatchups() {
    const matchups = await buildPostSeasonLeagueMatchups();
    const results = await insertLeagueMatchups(matchups);

    return results;
}

export async function syncRegularSeasonMatchups() {
    const matchups = await buildRegularSeasonLeagueMatchups();
    const results = await insertLeagueMatchups(matchups);

    return results;
}

export async function buildAndInsertLeagueMatchupHistory() {
    const matchups = await buildLeagueMatchupHistory();
    const results = await insertLeagueMatchups(matchups);

    return results;
}

export async function insertLeagueMatchups(matchups: StrictInsertMatchup[]) {
    const successfulMatchups: SelectMatchup[] = [];
    const CHUNK_SIZE = 6;
    // we use promise.all because of the relationship chain:
    // a league must exist, a sleeper user must exist, a league user, then a matchup of two league users
    // if an operation fails we could have bad database rows
    for (let i = 0; i < matchups.length; i += CHUNK_SIZE) {
        const chunk = matchups.slice(i, i + CHUNK_SIZE);
        const currentInsert = chunk.map(matchup => insertMatchup(matchup));
        const result = await Promise.all(currentInsert);
        successfulMatchups.push(...result);
    }

    return successfulMatchups;
}

// Bye-week rosters return NULL matchup_id from Sleeper. Since we can't
// upsert rows without a stable matchup_id, we only insert weeks 1-14
// (regular season) upfront. Weeks 15-17 are inserted once the playoff
// bracket is finalized and all matchup_ids are populated.
export async function buildRegularSeasonLeagueMatchups() {
    const sleeper = new Sleeper();
    const weeks = Array.from({ length: 14 }, (_, i) => i + 1); // weeks 1-14 regular season, 15-17 postseason
    const currentNFLState = await sleeper.getNFLState();
    const { season } = currentNFLState;

    const matchups = await Promise.all(
        weeks.map(async week => {
            const weeklyMatchups = await sleeper.getWeeklyLeagueMatchups(week);
            return rawToNormalizedMatchups(weeklyMatchups, season, week, config.league.id);
        })
    );

    return matchups.flat();
}

export async function buildPostSeasonLeagueMatchups() {
    const sleeper = new Sleeper();
    const weeks = [15, 16, 17]; // weeks 1-14 regular season, 15-17 postseason
    const currentNFLState = await sleeper.getNFLState();
    const { season } = currentNFLState;

    const matchups = await Promise.all(
        weeks.map(async week => {
            const weeklyMatchups = await sleeper.getWeeklyLeagueMatchups(week);
            return rawToNormalizedMatchups(weeklyMatchups, season, week, config.league.id);
        })
    );

    return matchups.flat();
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

export async function getAllMatchupHistory(leaguesMap: LeaguesMap[]) {
    const sleeper = new Sleeper();
    const weeks = Array.from({ length: 17 }, (v, i) => i + 1);

    // for each leagueId/season, for each week fetch matchups
    const allMatchupsByLeague = await Promise.all(
        leaguesMap.map(
            async (leagueMap) => {
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

export function rawToNormalizedMatchups(
    matchups: RawMatchup[],
    season: string,
    week: number,
    leagueId: string
): StrictInsertMatchup[] {

    return matchups
        .map(matchup => undefinedToNullDeep(matchup) as NullableRawMatchup)
        .map(matchup => normalizeMatchup(matchup, season, week, leagueId))
        .map(matchup => strictMatchupSchema.parse(matchup));
}

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
            ) : {};

    const startersPoints =
        typeof matchup.starters_points === 'object' && Array.isArray(matchup.starters_points) ?
            matchup.starters_points.map(value => normalizeString(value.toFixed(2))) : [];

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
        startersPoints,
        playersPoints
    } satisfies StrictMatchup;
}