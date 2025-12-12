import * as z from "zod";

/**
 * allowing null values?
 * A lot of the metadata tied to a user is undefined because it requires that the user
 * has actually interacted with that setting in the Sleeper app/settings.
 * This is okay, we will replace the undefined values with null.
 * 
 * We use looseObject for the same reason above, when it comes to metadata, 
 * i've noticed that sleeper adds additional keys based on interaction with settings or 
 * features like player nicknames, we don't want to not parse any 'extra' data that is added on to the response
 * because we may use that additional data for a future feature.
 * 
 * right now we are focusing on the required data shape, and further narrowing that data
 * before we store it in the database. Data normalization will take place within the /services for each type.
 */

const nullishStringArray = z.nullish(z.array(z.string()));
const nullishUnknownArray = z.nullish(z.array(z.unknown()));
const nullishUnknown = z.nullish(z.unknown());
const nullishString = z.nullish(z.string());
const nullishNumber = z.nullish(z.number());
const nullishBoolean = z.nullish(z.boolean());
const nullableStringArray = z.nullable(z.array(z.string()));
const nullableUnknownArray = z.nullable(z.array(z.unknown()));
const nullableUnknown = z.nullable(z.unknown());
const nullableString = z.nullable(z.string());
const nullableNumber = z.nullable(z.number());
const nullableBoolean = z.nullable(z.boolean());
const optionalNullishNumber = z.optional(nullishNumber);
const optionalNullableNumber = z.optional(nullableNumber);
const recordKeys = z.union([z.string(), z.number(), z.symbol()]);
const looseUnknowObject = z.record(recordKeys, z.unknown());

/**
 * why two similar schemas?
 * the first schema is what sleeper sends, we loosely validate it.
 * we replace an undefined values with null and then we parse our normalized data against the nullableSchema
 */
export const rawLeagueSchema = z.looseObject({
    league_id: z.string(),
    status: z.string(),
    season: z.string(),
    name: z.string(),
    avatar: z.string(),
    previous_league_id: nullishString,
    draft_id: z.string(),
    roster_positions: z.array(z.string()),
    total_rosters: z.number(),  // everything above is required
    metadata: looseUnknowObject,
    settings: looseUnknowObject,
    scoring_settings: looseUnknowObject,
    sport: z.string(),
});
export const nullableRawLeagueSchema = z.looseObject({
    league_id: z.string(),
    status: z.string(),
    season: z.string(),
    name: z.string(),
    avatar: z.string(),
    previous_league_id: nullableString,
    draft_id: z.string(),
    roster_positions: z.array(z.string()),
    total_rosters: z.number(), // everything above is required
    metadata: looseUnknowObject,
    settings: looseUnknowObject,
    scoring_settings: looseUnknowObject,
    sport: z.string(),
});

export type RawLeague = z.infer<typeof rawLeagueSchema>;
export type NullableRawLeague = z.infer<typeof nullableRawLeagueSchema>;

export const rawLeagueUserSchema = z.looseObject({
    user_id: z.string(),
    display_name: z.string(),
    metadata: z.looseObject({
        team_name: nullishString,
    }),
    avatar: z.string(), // everything above is required
    is_owner: nullishBoolean, // commissioner?
});
export const nullableLeagueUserSchema = z.looseObject({
    user_id: z.string(),
    display_name: z.string(),
    metadata: z.looseObject({
        team_name: nullishString,
    }),
    avatar: z.string(), // everything above is required
    is_owner: nullableBoolean,
});

export type RawLeagueUser = z.infer<typeof rawLeagueUserSchema>;
export type NullableRawLeagueUser = z.infer<typeof nullableLeagueUserSchema>;

export const rawNFLPlayerSchema = z.looseObject({
    player_id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    active: z.boolean(),
    fantasy_positions: nullishStringArray,
    position: nullishString,
    team: nullishString,
    number: nullishNumber,
    age: nullishNumber,
    injury_status: nullishString, // everything above is required
});
export const nullableRawNFLPlayerSchema = z.looseObject({
    player_id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    active: z.boolean(),
    fantasy_positions: nullableStringArray,
    position: nullableString,
    team: nullableString,
    number: nullishNumber,
    age: nullishNumber,
    injury_status: nullableString, // everything above is required
});

export type RawNFLPlayer = z.infer<typeof rawNFLPlayerSchema>;
export type NullableRawNFLPlayer = z.infer<typeof nullableRawNFLPlayerSchema>;

export const rosterSchema = z.looseObject({
    starters: z.array(z.string()),
    settings: z.looseObject({
        wins: z.number(),
        waiver_position: z.number(),
        waiver_budget_used: z.number(),
        total_moves: z.number(),
        ties: z.number(),
        losses: z.number(),
        fpts_decimal: z.number(),
        fpts_against_decimal: z.number(),
        fpts_against: z.number(),
        fpts: z.number()
    }),
    roster_id: z.number(),
    reserve: nullishStringArray,
    players: z.array(z.string()),
    owner_id: z.string(),
    league_id: z.string(),
    metadata: z.looseObject({
        record: nullishString,
        streak: nullishString
    }),
});
export type RawRoster = z.infer<typeof rosterSchema>;

export const matchupSchema = z.looseObject({
    starters: z.array(z.string()),
    roster_id: z.number(),
    players: z.array(z.string()),
    matchup_id: z.number(),
    points: z.number(),
    custom_points: nullishNumber
});
export type RawMatchup = z.infer<typeof matchupSchema>;

export const NFLStateSchema = z.looseObject({
    week: z.number(),
    season_type: z.string(),
    season_start_date: z.string(),
    season: z.string(),
    previous_season: z.string(),
    leg: z.number(),
    league_season: z.string(),
    league_create_season: z.string(),
    display_week: z.number()
});
export type RawNFLState = z.infer<typeof NFLStateSchema>;

export const bracketMatchupSchema = z.looseObject({
    w: nullishNumber,
    l: nullishNumber,
});
export const bracketSchema = z.looseObject({
    m: z.number(),
    r: z.number(),
    l: nullishNumber,
    w: nullishNumber,
    p: nullishNumber,
    t1: nullishNumber,
    t2: nullishNumber,
    t1_from: bracketMatchupSchema.nullish(),
    t2_from: bracketMatchupSchema.nullish(),
});
export type RawBracketMatchup = z.infer<typeof bracketMatchupSchema>;
export type RawBracket = z.infer<typeof bracketSchema>;