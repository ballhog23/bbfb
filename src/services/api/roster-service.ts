import { Sleeper } from "../../lib/sleeper.js";
import {
    strictRosterSchema,
    type RawRoster, NullableRawRoster, StrictRoster
} from "../../lib/zod.js";
import { undefinedToNullDeep, normalizeString } from "../../lib/helpers.js";
import { selectAllLeagues } from "../../db/queries/leagues.js";
import { insertLeagueRoster } from "../../db/queries/rosters.js";
import { config } from "../../config.js";
import type { SelectRoster, StrictInsertRoster } from "../../db/schema.js";

export type LeaguesMap = {
    leagueId: string,
    season: string;
};

type RawLeagueRecord = {
    season: string,
    rosters: RawRoster[];
};

export async function syncLeagueRosters() {
    const rosters = await buildCurrentLeagueRosters();
    const result = await insertLeagueRosters(rosters);

    return result;
}

export async function buildAndInsertLeagueRostersHistory() {
    const rosters = await buildLeagueRostersHistory();
    const result = await insertLeagueRosters(rosters);

    return result;
}

async function insertLeagueRosters(leagueRosters: StrictInsertRoster[]): Promise<SelectRoster[]> {
    const successfulRosters: SelectRoster[] = [];
    const BATCH_SIZE = 12; // 12 rosters per league season

    for (let i = 0; i < leagueRosters.length; i += BATCH_SIZE) {
        const chunk = leagueRosters.slice(i, i + BATCH_SIZE);
        const currentInsert = chunk.map(roster => insertLeagueRoster(roster));
        const result = await Promise.all(currentInsert);
        successfulRosters.push(...result);
    }

    return successfulRosters;
}

async function buildCurrentLeagueRosters(): Promise<StrictInsertRoster[]> {
    const sleeper = new Sleeper();
    // fetch current rosters
    const rawRosters = await sleeper.getLeagueRosters();
    // need current season year, the issue with pulling this from the database is what if its the offseason and we
    // are running our sync job looking for new season. currently leagueId is hardcoded in env/config,
    // i may as well hardcode the season year right now to make this easier to test for syncing this year,
    // we can worry about detecting new leagues in the future
    return rawToNormalizedRosters(rawRosters, config.league.season);
}

export async function buildLeagueHistoryMap(): Promise<LeaguesMap[]> {
    return (
        await selectAllLeagues()).map(
            ({ leagueId, season }) => ({ leagueId, season })
        );
}

async function buildLeagueRostersHistory(): Promise<StrictInsertRoster[]> {
    const leagueHistoryMap = await buildLeagueHistoryMap();
    const allRawLeagueRosters = await getAllRosters(leagueHistoryMap);
    const normalizedLeagueRosters: StrictRoster[] = [];

    for (const leagueRosters of allRawLeagueRosters) {
        const { season, rosters } = leagueRosters;
        normalizedLeagueRosters.push(
            ...rawToNormalizedRosters(rosters, season)
        );
    }

    return normalizedLeagueRosters;
}

async function getAllRosters(leaguesMap: LeaguesMap[]): Promise<RawLeagueRecord[]> {
    const sleeper = new Sleeper();

    const allRostersByLeague = await Promise.all(
        leaguesMap.map(
            async ({ leagueId, season }) => ({ season, rosters: await sleeper.getLeagueRosters(leagueId) })
        )
    );

    return allRostersByLeague;
}

function normalizeRoster(roster: NullableRawRoster, seasonYear: string): StrictRoster {
    // im not sure if an edge case is that a league user could drop all players on their roster and it could be empty
    const starters = roster.starters ? roster.starters.map(playerId => normalizeString(playerId)) : [];
    const players = roster.players ? roster.players.map(playerId => normalizeString(playerId)) : [];
    const injuredReserve = roster.reserve ? roster.reserve.map(playerId => normalizeString(playerId)) : null;
    // check for streak and record, returns null when new season and no drafted players
    const streak = roster.metadata?.streak ? normalizeString(roster.metadata.streak) : null;
    const record = roster.metadata?.record ? normalizeString(roster.metadata.record) : null;
    const fptsAgainst = roster.settings.fpts_against ?? 0;

    return {
        rosterOwnerId: normalizeString(roster.owner_id),
        leagueId: normalizeString(roster.league_id),
        season: normalizeString(seasonYear), // we derive this during normalization
        rosterId: roster.roster_id,
        starters,
        wins: roster.settings.wins,
        ties: roster.settings.ties,
        losses: roster.settings.losses,
        fptsAgainst,
        fpts: roster.settings.fpts,
        players,
        reserve: injuredReserve,
        streak,
        record,
        division: roster.settings.division
    } satisfies StrictRoster;

}

function rawToNormalizedRosters(rawRosters: RawRoster[], seasonYear: string): StrictRoster[] {
    return rawRosters
        .map(roster => undefinedToNullDeep(roster) as NullableRawRoster)
        .map(roster => normalizeRoster(roster, seasonYear))
        .map(roster => strictRosterSchema.parse(roster));
}