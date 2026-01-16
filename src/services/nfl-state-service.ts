import type { StrictInsertLeagueState } from "../db/schema.js";
import { strictLeagueStateSchema, type RawNFLState, NullableRawNFLState, StrictLeagueState } from "../lib/zod.js";
import { Sleeper } from "../lib/sleeper.js";
import { normalizeString, undefinedToNullDeep } from "../lib/helpers.js";

export async function getSleeperNFLState(): Promise<RawNFLState> {
    const sleeper = new Sleeper();
    return await sleeper.getNFLState();
}

export function normalizeLeagueState(rawNFLState: NullableRawNFLState): StrictInsertLeagueState {
    // week 17 marks the end of our leagues season
    // sleeper will restart a whole season type under postseason on their api response
    // so we stop trusting their data after leg 17 which is the week of the nfl regular season,
    // at week 15 we pivot our status to postseason.

    // if a leg is present and positive we can assume sleeper data is what we expect to generate a league state
    // otherwise we will assume its frozen state at the end of the previous season before the league is to be renewed
    // we are under the assumption that if the nfl season type is 'pre' that week will be populated 1-4 reflecting preseason weeks
    // just as post season is reflected in a similar manner as i currently review the api response from sleeper
    // Only trust positive leg values, cap at 17 for final snapshot
    let normalizedLeg = typeof rawNFLState.leg === 'number' && rawNFLState.leg > 0
        ? Math.min(rawNFLState.leg, 17)
        : 17;

    // Determine seasonType for our strict league state
    const seasonType = normalizedLeg <= 14 ? 'regular' : normalizedLeg <= 17 ? 'post' : 'off';

    const isRegularOrPostSeason = seasonType === 'regular' || seasonType === 'post';
    const week = isRegularOrPostSeason ?
        (typeof rawNFLState.week === 'number' && rawNFLState.week > 0 ? rawNFLState.week : normalizedLeg) :
        17;

    const displayWeek = isRegularOrPostSeason ?
        (typeof rawNFLState.display_week === 'number' && rawNFLState.display_week > 0 ? rawNFLState.display_week :
            week) :
        17;

    return {
        week,
        leg: normalizedLeg,
        season: normalizeString(rawNFLState.season),
        seasonType,
        leagueSeason: rawNFLState.league_season,
        previousSeason: rawNFLState.previous_season,
        seasonStartDate: rawNFLState.season_start_date,
        displayWeek,
        leagueCreateSeason: rawNFLState.league_create_season,
        seasonHasScores: rawNFLState.season_has_scores ?? false,
        isLeagueActive:
            (seasonType === 'regular' || seasonType === 'post') &&
            normalizedLeg >= 1 &&
            normalizedLeg <= 17
    } satisfies StrictInsertLeagueState;
}

export function rawToNormalizedLeagueState(rawNFLState: RawNFLState) {
    const nullableSeasonState = undefinedToNullDeep(rawNFLState) as NullableRawNFLState;
    const normalizedSeasonState = normalizeLeagueState(nullableSeasonState);
    return strictLeagueStateSchema.parse(normalizedSeasonState);
}

// eventbridge + lambda sync
// if the function returns null we know that we don't want to store a new snapshot of the league state
export async function syncLeagueState(): Promise<StrictLeagueState | null> {
    const rawNFLState = await getSleeperNFLState();
    const leg = rawNFLState.leg;

    // League active regular season, weeks 1–17
    if (typeof leg === 'number' && leg >= 1 && leg <= 17 && rawNFLState.season_type === 'regular') {
        return rawToNormalizedLeagueState(rawNFLState);
    }

    // League over - force end of season snapshot for UI display
    if (typeof leg === 'number' && leg > 17) {
        const endOfSeasonState: RawNFLState = {
            ...rawNFLState,
            week: 17,
            display_week: 17,
            leg: 17,
        };
        return rawToNormalizedLeagueState(endOfSeasonState);
    }

    // NFL preseason or NFL postseason, irrelevant to the state of our league
    return null;
}
