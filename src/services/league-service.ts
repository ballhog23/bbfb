import type { StrictInsertLeague } from "../db/schema.js";
import { Sleeper } from "../lib/sleeper.js";
import {
    rawLeagueSchema, strictLeagueSchema,
    type RawLeague, NullableRawLeague
} from "../lib/zod.js";
import { insertLeague } from "../db/queries/leagues.js";
import { undefinedToNullDeep, normalizeString } from "../lib/helpers.js";

export async function insertLeagueService() {
    const sleeper = new Sleeper();
    // currently we hardcode league id in config, we can probably get the bbfb redraft league id
    // dynamically by hitting sleepers endpoint for all leagues a user is a part of and figure out how to
    // create our leagues going forward in a unique manner to allow retrival of that id, for now hardcode is simple
    const league = await sleeper.getLeague();
    const normalizedLeague = rawToNormalizedLeagueData([league])[0]; // returns the only item in the array
    await insertLeague(normalizedLeague);
    return normalizedLeague;
}

export async function buildAndInsertLeagueHistory() {
    const leagues = await buildLeagueHistory();

    for (const league of leagues) {
        await insertLeague(league);
    }

    return leagues;
}

export async function buildLeagueHistory(): Promise<StrictInsertLeague[]> {
    const rawAllLeagues = await getAllLeagues();

    return rawToNormalizedLeagueData(rawAllLeagues);
}

export async function getAllLeagues(): Promise<RawLeague[]> {
    const sleeper = new Sleeper();
    // get current league, then we can walk back leagues
    const rawCurrentLeague = rawLeagueSchema.parse(await sleeper.getLeague());
    const rawAllLeagues: RawLeague[] = [rawCurrentLeague];
    const seenLeagueIds = new Set<string>([rawCurrentLeague.league_id]);
    let previousLeagueId: string | null = rawCurrentLeague.previous_league_id ?? null;

    while (previousLeagueId !== null) {
        if (seenLeagueIds.has(previousLeagueId)) {
            throw new Error(`Cycle detected, League Id: ${previousLeagueId} present in membership check.`);
        }
        seenLeagueIds.add(previousLeagueId);

        const rawPreviousLeague = rawLeagueSchema.parse(
            await sleeper.getLeague(previousLeagueId)
        );

        rawAllLeagues.push(rawPreviousLeague);
        previousLeagueId = rawPreviousLeague.previous_league_id ?? null;
    }

    return rawAllLeagues;
}

export async function syncLeague(): Promise<StrictInsertLeague> {
    const sleeper = new Sleeper();
    const [league] = rawToNormalizedLeagueData([await sleeper.getLeague()]);
    await insertLeague(league);
    return league;
}

export function normalizeLeague(rawLeague: NullableRawLeague) {
    const previousLeagueId = rawLeague.previous_league_id ? normalizeString(rawLeague.previous_league_id) : null;

    return {
        leagueId: normalizeString(rawLeague.league_id),
        status: normalizeString(rawLeague.status),
        season: normalizeString(rawLeague.season),
        leagueName: normalizeString(rawLeague.name),
        avatarId: normalizeString(rawLeague.avatar),
        previousLeagueId,
        draftId: normalizeString(rawLeague.draft_id),
        rosterPositions: rawLeague.roster_positions.map(normalizeString),
        totalRosters: rawLeague.total_rosters,
    } satisfies StrictInsertLeague;
}

export function rawToNormalizedLeagueData(rawLeagues: RawLeague[]): StrictInsertLeague[] {
    const nullableAllLeagues = rawLeagues.map(
        rawLeague => undefinedToNullDeep(rawLeague) as NullableRawLeague
    );
    const normalizedLeagues = nullableAllLeagues.map(
        nullableLeague => normalizeLeague(nullableLeague)
    );

    return normalizedLeagues.map(
        normalizedLeague => strictLeagueSchema.parse(normalizedLeague)
    );
}