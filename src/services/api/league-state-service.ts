import type { SelectLeagueState, StrictInsertLeagueState } from "../../db/schema.js";
import { strictLeagueStateSchema, type RawNFLState, NullableRawNFLState, StrictLeagueState } from "../../lib/zod.js";
import { Sleeper } from "../../lib/sleeper.js";
import { normalizeString, undefinedToNullDeep } from "../../lib/helpers.js";
import { insertLeagueState } from "../../db/queries/league-state.js";

export async function getSleeperNFLState(): Promise<RawNFLState> {
    const sleeper = new Sleeper();
    return await sleeper.getNFLState();
}

export function normalizeLeagueState(rawNFLState: NullableRawNFLState, rawLeg: number | null): StrictInsertLeagueState {
    // week 17 marks the end of our leagues season
    // sleeper will restart a whole season type under postseason on their api response
    // so we stop trusting their data after leg 17 which is the week of the nfl regular season,
    // at week 15 we pivot our status to postseason.

    // if a leg is present and positive we can assume sleeper data is what we expect to generate a league state
    // otherwise we will assume its frozen state at the end of the previous season before the league is to be renewed
    // we are under the assumption that if the nfl season type is 'pre' that week will be populated 1-4 reflecting preseason weeks
    // just as post season is reflected in a similar manner as i currently review the api response from sleeper
    // Only trust positive leg values, cap at 17 for final snapshot

    // Determine seasonType for our strict league state
    const normalizedLeg =
        typeof rawLeg === 'number' && rawLeg > 0 ? rawLeg : 18;

    // Determine seasonType for our strict league state
    const seasonType =
        normalizedLeg <= 14 ? 'regular' : normalizedLeg <= 17 ? 'post' : 'off';

    const isRegularOrPostSeason = seasonType === 'regular' || seasonType === 'post';

    const week = isRegularOrPostSeason
        ? typeof rawNFLState.week === 'number' && rawNFLState.week > 0
            ? rawNFLState.week
            : normalizedLeg
        : 17;

    const displayWeek = isRegularOrPostSeason
        ? typeof rawNFLState.display_week === 'number' && rawNFLState.display_week > 0
            ? rawNFLState.display_week
            : week
        : 17;

    return {
        id: 1,
        week,
        leg: normalizedLeg,
        season: normalizeString(rawNFLState.season),
        seasonType,
        previousSeason: rawNFLState.previous_season,
        displayWeek,
        isLeagueActive: isRegularOrPostSeason && normalizedLeg >= 1 && normalizedLeg <= 17,
    } satisfies StrictInsertLeagueState;
}

export function rawToNormalizedLeagueState(rawNFLState: RawNFLState, normalizedLeg: number) {
    const nullableSeasonState = undefinedToNullDeep(rawNFLState) as NullableRawNFLState;
    const normalizedSeasonState = normalizeLeagueState(nullableSeasonState, normalizedLeg);
    return strictLeagueStateSchema.parse(normalizedSeasonState);
}

// if the function returns null we know that we don't want to store a new snapshot of the league state
export async function syncLeagueState(): Promise<SelectLeagueState | null> {
    const rawNFLState = await getSleeperNFLState();
    const rawLeg = rawNFLState.leg;

    // League active regular season, weeks 1–17
    if (typeof rawLeg === 'number' && rawLeg >= 1 && rawLeg <= 17 && rawNFLState.season_type === 'regular') {
        const normalizedLeagueState = rawToNormalizedLeagueState(rawNFLState, rawLeg);
        return await insertLeagueState(normalizedLeagueState);
    }

    // League over - force end of season snapshot for UI display
    if (typeof rawLeg === 'number' && rawLeg > 17) {
        const endOfSeasonState: RawNFLState = {
            ...rawNFLState,
            week: 17,
            display_week: 17,
            leg: rawLeg, // needs to be clamped to 18 for final snapshot logic to update correctly
        };
        const normalizedLeagueState = rawToNormalizedLeagueState(endOfSeasonState, rawLeg);
        return await insertLeagueState(normalizedLeagueState);
    }

    // NFL preseason or NFL postseason, irrelevant to the state of our league
    return null;
}
