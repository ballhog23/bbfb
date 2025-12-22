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
const nullishObject = z.nullish(z.object());
const nullableStringArray = z.nullable(z.array(z.string()));
const nullableUnknownArray = z.nullable(z.array(z.unknown()));
const nullableUnknown = z.nullable(z.unknown());
const nullableString = z.nullable(z.string());
const nullableNumber = z.nullable(z.number());
const nullableBoolean = z.nullable(z.boolean());
const optionalNullishNumber = z.optional(nullishNumber);
const optionalNullableNumber = z.optional(nullableNumber);
const recordKeys = z.union([z.string(), z.number(), z.symbol()]);
const leagueStatusEnum = z.enum(["pre_draft", "drafting", "in_season", "complete", "post_season"]);

// ! LEAGUES ARE OKAY
/**
 * why two similar schemas?
 * the first schema is what sleeper sends, we loosely validate it, testing for required data.
 * we replace an undefined values with null and then we parse our normalized data against the strictSchema
 */
export const rawLeagueSchema = z.looseObject({
    league_id: z.string(),
    status: leagueStatusEnum,
    season: z.string(),
    name: z.string(),
    avatar: z.string(),
    previous_league_id: nullishString,
    draft_id: z.string(),
    roster_positions: z.array(z.string()),
    total_rosters: z.number(),
});
export const strictLeagueSchema = z.strictObject({
    leagueId: z.string(),
    status: leagueStatusEnum,
    season: z.string(),
    leagueName: z.string(),
    avatarId: z.string(),
    previousLeagueId: nullableString,
    draftId: z.string(),
    rosterPositions: z.array(z.string()),
    totalRosters: z.number(),
});
export type RawLeague = z.infer<typeof rawLeagueSchema>;
export type NullableRawLeague = {
    league_id: string;
    status: string;
    season: string;
    name: string;
    avatar: string;
    draft_id: string;
    roster_positions: string[];
    total_rosters: number;
    previous_league_id: string | null;
};
export type StrictLeague = z.infer<typeof strictLeagueSchema>;

// ! SLEEPER USERS ARE OKAY
export const rawSleeperUserSchema = z.looseObject({
    username: z.string(),
    user_id: z.string(),
    display_name: z.string(),
    avatar: z.string(),
});
export const strictSleeperUserSchema = z.strictObject({
    userName: z.string(),
    userId: z.string(),
    displayName: z.string(),
    avatarId: z.string(),
});
export type RawSleeperUser = z.infer<typeof rawSleeperUserSchema>;
export type StrictSleeperUser = z.infer<typeof strictSleeperUserSchema>;

// ! LEAGUE USERS ARE OKAY 
// noticed that sleeper sends avatar as part of this schema, but the one on the root level appears to be stale
// it can differ from the avatar stored in Sleeper User schema.
// sleeper sends a THIRD avatar which is associated with the TEAM. this is only present if a league user adds this
// this THIRD avatar within the metadata is current, we will parse this and if not we can fall back on the sleeper user 
export const rawLeagueUserSchema = z.looseObject({
    user_id: z.string(),
    metadata: z.looseObject({
        team_name: nullishString,
        avatar: nullishString,
    }),
    is_owner: z.boolean(),
});
export const strictLeagueUserSchema = z.strictObject({
    userId: z.string(),
    leagueId: z.string(),
    teamName: nullableString,
    avatarId: nullableString,
    isOwner: z.boolean()
});
export type RawLeagueUser = z.infer<typeof rawLeagueUserSchema>;
export type NullableRawLeagueUser = {
    user_id: string;
    display_name: string;
    metadata: {
        team_name: string | null;
        avatar: string | null;
    };
    is_owner: boolean;
};
export type StrictLeagueUser = z.infer<typeof strictLeagueUserSchema>;

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
    injury_status: nullishString,
});
export const strictNFLPlayerSchema = z.strictObject({
    playerId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    active: z.boolean(),
    fantasyPositions: nullableStringArray,
    position: nullableString,
    team: nullableString,
    number: nullableNumber,
    age: nullableNumber,
    injuryStatus: nullableString,
});

export type RawNFLPlayer = z.infer<typeof rawNFLPlayerSchema>;
export type NullableRawNFLPlayer = {
    player_id: string;
    first_name: string;
    last_name: string;
    active: boolean;
    fantasy_positions: string[] | null;
    position: string | null;
    team: string | null;
    number: number | null;
    age: number | null;
    injury_status: string | null;
};
export type StrictNFLPLayer = z.infer<typeof strictNFLPlayerSchema>;

export const rawRosterSchema = z.looseObject({
    owner_id: z.string(),
    league_id: z.string(),
    roster_id: z.number(),
    starters: z.array(z.string()),
    settings: z.looseObject({
        wins: z.number(),
        ties: z.number(),
        losses: z.number(),
        fpts_against: z.number(),
        fpts: z.number(),
    }),
    players: z.array(z.string()),
    reserve: nullishStringArray,
    metadata: z.looseObject({
        streak: nullishString,
        record: nullishString,
    }),
});
export const strictRosterSchema = z.strictObject({
    ownerId: z.string(),
    leagueId: z.string(),
    season: z.string(),
    rosterId: z.number(),
    starters: z.array(z.string()),
    wins: z.number(),
    ties: z.number(),
    losses: z.number(),
    fptsAgainst: z.number(),
    fpts: z.number(),
    players: z.array(z.string()),
    reserve: nullableStringArray,
    streak: nullableString,
    record: nullableString,
});

export type RawRoster = z.infer<typeof rawRosterSchema>;
export type NullableRawRoster = {
    owner_id: string;
    league_id: string;
    roster_id: number;
    starters: string[];
    settings: {
        wins: number;
        ties: number;
        losses: number;
        fpts_against: number;
        fpts: number;
    };
    players: string[];
    metadata: {
        record: string | null;
        streak: string | null;
    };
    reserve: string[] | null;
};
export type StrictRoster = z.infer<typeof strictRosterSchema>;

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