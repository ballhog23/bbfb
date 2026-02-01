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

// ! GOAL: WORK ON HISTORICAL PRESENTATION OF DATA BECAUSE ITS THE OFFSEASON, DATA SYNC WE WILL WORK ON NEXT
// ! DATA SYNC WILL LOOK SOMETHING LIKE, KEEP TRACK OF NFL STATE (SLEEPER LEAGUE SEASON, WEEK) IN DB AND HYDRATE CONFIG FROM THERE
type RawWeeklyMatchupRecord = {
    week: number,
    matchups: RawMatchup[];
};

type RawLeagueMatchups = {
    season: string,
    leagueId: string,
    allMatchupsPerWeek: RawWeeklyMatchupRecord[];
};

export async function syncMatchups() {
    const matchups = await buildRegularSeasonLeagueMatchups();
    // const results = await insertLeagueMatchups(matchups);

    return matchups;
}

export async function buildAndInsertLeagueMatchupHistory() {
    const matchups = await buildLeagueMatchupHistory();
    const results = await insertLeagueMatchups(matchups);

    return results;
}

export async function insertLeagueMatchups(matchups: StrictInsertMatchup[]) {
    const successfulMatchups: SelectMatchup[] = [];
    const CHUNK_SIZE = 12;

    // we chunk by 12 because there are 12 matchups per week (look into 15-17 and how we will manage playoffs)
    // when building history we treat each seasons week as the batch insert
    for (let i = 0; i < matchups.length; i += CHUNK_SIZE) {
        const chunk = matchups.slice(i, i + CHUNK_SIZE);
        const currentInsert = chunk.map(matchup => insertMatchup(matchup));
        const result = await Promise.all(currentInsert);
        successfulMatchups.push(...result);
    }

    return successfulMatchups;
}

// The issue we may face is that bye weeks are stored as NULL matchup id
// if we store all weekly matchups 1-17 at the start of the season, we risk adding multiple rows throughout the season?
// beacuse the composite key is leagueId, rosterId, week, it would add new rows not update exisiting rows
// so the approach should more than likely be add 1-14, then when the playoff schedule is set, we can add 15-17
// the implementation will be nearly identical to fetching all of the matchups in the history of the league
// i think we will make an endpoint to get sleeper nfl state and store in db to hydrate config object instead of
// hardcoding things like season and week, expose the sleeper data from our db as source of truth,
// expose put endpoint for lamda to run refresh functions to maintain snapshots from sleeper
export async function buildRegularSeasonLeagueMatchups() {
    const sleeper = new Sleeper();
    const weeks = Array.from({ length: 14 }, (v, i) => i + 1); // weeks 1-14 regular season, 15-17 postseason
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
    leagueId: string): StrictInsertMatchup[] {

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