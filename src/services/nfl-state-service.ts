import { strictLeagueStateSchema, type RawNFLState, NullableRawNFLState, StrictLeagueState } from "../lib/zod.js";
import { Sleeper } from "../lib/sleeper.js";
import { normalizeString, undefinedToNullDeep } from "../lib/helpers.js";

export async function getSleeperNFLState() {
    const sleeper = new Sleeper();
    return await sleeper.getNFLState();
}

export function normalizeLeagueState(rawNFLState: NullableRawNFLState) {
    // week 17 marks the end of our leagues season
    // sleeper will restart a whole season type under postseason on their api response
    // so we stop trusting their data after leg 17 which is the week of the nfl regular season,
    // at week 15 we pivot our status to postseason.

    // if a leg is present and positive we can assume sleeper data is what we expect to generate a league state
    // otherwise we will assume its frozen state at the end of the previous season before the league is to be renewed
    // we are under the assumption that if the nfl season type is 'pre' that week will be populated 1-4 reflecting preseason weeks
    // just as post season is reflected in a similar manner as i currently review the api response from sleeper
    let leg = rawNFLState.leg;

    // Only trust positive leg values
    let normalizedLeg = typeof leg === 'number' && leg > 0 ? leg : null;

    // If leg exceeds 17 → end-of-season snapshot
    if (normalizedLeg !== null && normalizedLeg > 17) {
        normalizedLeg = 17;
    }

    const seasonType = (() => {
        if (normalizedLeg === null) return 'off';
        if (normalizedLeg <= 14) return 'regular';
        if (normalizedLeg >= 15 && normalizedLeg <= 17) return 'post';
        return 'off';
    })();

    // Week and displayWeek
    let week: number | null = null;
    let displayWeek: number | null = null;

    if (seasonType === 'regular' || seasonType === 'post') {
        week =
            typeof rawNFLState.week === 'number' && rawNFLState.week > 0
                ? rawNFLState.week
                : normalizedLeg;

        displayWeek =
            typeof rawNFLState.display_week === 'number' && rawNFLState.display_week > 0
                ? rawNFLState.display_week
                : week;
    } else {
        // offseason or preseason → default view to end-of-last-league-season
        week = 17;
        displayWeek = 17;
        normalizedLeg = 17; // ensure leg also reflects final snapshot
    }

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
            normalizedLeg !== null &&
            normalizedLeg >= 1 &&
            normalizedLeg <= 17
    } satisfies StrictLeagueState;
}

export function rawToNormalizedLeagueState(rawNFLState: RawNFLState) {
    const nullableSeasonState = undefinedToNullDeep(rawNFLState) as NullableRawNFLState;
    const normalizedSeasonState = normalizeLeagueState(nullableSeasonState);
    return strictLeagueStateSchema.parse(normalizedSeasonState);
}

// eventbridge + lambda
export async function getAndNormalizeLeagueState(): Promise<StrictLeagueState | null> {
    const rawNFLState = await getSleeperNFLState();
    const leg = rawNFLState.leg;

    // Case 1: League active (regular season, weeks 1–17)
    if (typeof leg === 'number' && leg >= 1 && leg <= 17 && rawNFLState.season_type === 'regular') {
        return rawToNormalizedLeagueState(rawNFLState);
    }

    // Case 2: League over (final snapshot)
    if (typeof leg === 'number' && leg > 17) {
        // Force normalization to end-of-season view
        const endOfSeasonState: RawNFLState = {
            ...rawNFLState,
            week: 17,
            display_week: 17,
            leg: 17, // ensure normalization logic sets leg to 17
        };
        return rawToNormalizedLeagueState(endOfSeasonState);
    }

    // Case 3: NFL preseason or NFL postseason → do nothing
    return null;
}
