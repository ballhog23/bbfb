import { Sleeper } from "../lib/sleeper.js";
import {
    rawRosterSchema, strictRosterSchema,
    type RawRoster, NullableRawRoster, StrictRoster
} from "../lib/zod.js";
import { undefinedToNullDeep, normalizeString } from "../lib/helpers.js";
import { selectAllLeagues } from "../db/queries/leagues.js";

export async function buildLeagueRostersHistory() {
    const leagueHistory: LeagueMap[] = (await selectAllLeagues()).map(({ leagueId, season }) => ({ leagueId, season }));
    const allRawLeagueRosters = await getAllRosters(leagueHistory);
    const normalizedLeagueRosters: StrictRoster[] = [];

    for (const leagueRosters of allRawLeagueRosters) {
        const { season, rosters } = leagueRosters;
        normalizedLeagueRosters.push(...rawToNormalizedRosters(rosters, season));
    }

    return normalizedLeagueRosters;
}

type LeagueMap = {
    leagueId: string,
    season: string;
};

type RawLeagueRecord = {
    season: string,
    rosters: RawRoster[];
};

// only goal is to return a history of all rosters from all seasons by league/season year for use in normalization.
// zod loosely validates data on call to sleeper.getLeagueRosters()
export async function getAllRosters(leagueMap: LeagueMap[]): Promise<RawLeagueRecord[]> {
    const sleeper = new Sleeper();

    const allRostersByLeague = await Promise.all(leagueMap.map(
        async ({ leagueId, season }) => ({ season, rosters: await sleeper.getLeagueRosters(leagueId) })
    ));

    return allRostersByLeague;
}

export function normalizeRoster(roster: RawRoster, seasonYear: string): StrictRoster {
    // im not sure if an edge case is that a league user could drop all players on their roster and it could be empty
    const starters = roster.starters ? roster.starters.map(playerId => normalizeString(playerId)) : [];
    const players = roster.players ? roster.players.map(playerId => normalizeString(playerId)) : [];
    // sleeper sends explicit null (at this point in time)
    const injuredReserve = roster.reserve ? roster.reserve.map(playerId => normalizeString(playerId)) : null;
    // check for streak and record, my suspicion is that sleeper will send these as empty strings at start of season.
    const streak = roster.metadata?.streak ? normalizeString(roster.metadata.streak) || null : null;
    const record = roster.metadata?.record ? normalizeString(roster.metadata.record) || null : null;

    return {
        ownerId: normalizeString(roster.owner_id),
        leagueId: normalizeString(roster.league_id),
        season: normalizeString(seasonYear), // we add this for easy sql
        rosterId: roster.roster_id,
        starters,
        wins: roster.settings.wins,
        ties: roster.settings.ties,
        losses: roster.settings.losses,
        fptsAgainst: roster.settings.fpts_against,
        fpts: roster.settings.fpts,
        players,
        reserve: injuredReserve,
        streak,
        record,
    } satisfies StrictRoster;

}

export function rawToNormalizedRosters(rawRosters: RawRoster[], seasonYear: string): StrictRoster[] {
    return rawRosters
        .map(roster => undefinedToNullDeep(roster) as NullableRawRoster)
        .map(roster => normalizeRoster(roster, seasonYear))
        .map(roster => strictRosterSchema.parse(roster));
}