import type { InsertLeague } from "../db/schema.js";
import type { RawLeague } from "../lib/zod.js";
import { Sleeper } from "../lib/sleeper.js";
import { undefinedToNullDeep, normalizeString } from "../lib/helpers.js";

export async function buildLeagueHistory() {
    // const sleeper = new Sleeper();
    // const rawCurrentLeague = await sleeper.getLeague();
    // const rawPreviousLeagues = await getPreviousLeagues(rawCurrentLeague);
    // const rawAllLeagues = [rawCurrentLeague, ...(rawPreviousLeagues ?? [])];
    // const strictAllLeagues = undefinedToNullDeep(rawAllLeagues) as unknown as Required<Array<InsertLeague>>;

    // return strictAllLeagues.map(league => {
    //     const statusString = normalizeString(league.status);
    //     const leagueStatus = statusString === 'in_season' || statusString === "post_season" ? true : false;
    //     const rosterPositions = league.roster_positions.map(position => normalizeString(position));

    //     return {
    //         leagueId: normalizeString(league.league_id),
    //         season: normalizeString(league.season),
    //         status: leagueStatus,
    //         leagueName: normalizeString(league.name),
    //         draftId: normalizeString(league.draft_id),
    //         totalRosters: league.total_rosters,
    //         rosterPositions: rosterPositions,
    //         avatarId: normalizeString(league.avatar),
    //         previousLeagueId: league.previous_league_id ? normalizeString(league.previous_league_id) : null,
    //     } satisfies InsertLeague;
    // });
}

export async function getPreviousLeagues(league: RawLeague): Promise<RawLeague[] | null> {
    if (!league.previous_league_id) return null;
    const sleeper = new Sleeper();
    const prevLeagues: RawLeague[] = [];
    let current: string | null = league.previous_league_id;

    while (current !== null) {
        const prevLeague = await sleeper.getLeague(current);
        prevLeagues.push(prevLeague);
        current = prevLeague.previous_league_id || null;
    }

    return prevLeagues;
}