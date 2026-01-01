import { Sleeper } from "../lib/sleeper.js";
import {
    strictMatchupSchema,
    type RawMatchup, NullableRawMatchup, StrictMatchup
} from "../lib/zod.js";
import { undefinedToNullDeep, normalizeString } from "../lib/helpers.js";
import { buildLeagueHistoryMap, LeaguesMap } from "./roster-service.js";
import { insertMatchup } from "../db/queries/matchup.js";
import { StrictInsertMatchup } from "../db/schema.js";
import { config } from "../config.js";
import { BadRequestError } from "../lib/errors.js";

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
    const matchups = await buildCurrentLeagueMatchups();
    const results = await insertLeagueMatchups(matchups);

    return results;
}

export async function buildAndInsertLeagueMatchupHistory() {
    const matchups = await buildLeagueMatchupHistory();
    const results = await insertLeagueMatchups(matchups);

    return results;
}

export async function insertLeagueMatchups(matchups: StrictInsertMatchup[]) {
    const CHUNK_SIZE = 17;

    for (let i = 0; i < matchups.length; i += CHUNK_SIZE) {
        const chunk = matchups.slice(i, i + CHUNK_SIZE);
        const currentInsert = chunk.map(matchup => insertMatchup(matchup));
        await Promise.all(currentInsert);
    }
    return matchups;
}

export async function buildCurrentLeagueMatchups() {
    const sleeper = new Sleeper();
    const currentNFLState = await sleeper.getNFLState();
    const { week, season } = currentNFLState;
    if (week > 17)
        throw new BadRequestError('End of fantasy season, will not retrieve any further weekly matchups.');

    const matchups = await sleeper.getWeeklyLeagueMatchups(week, config.league.id);
    return rawToNormalizedMatchups(matchups, season, week, config.league.id);
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