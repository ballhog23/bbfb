import * as z from "zod";
const nullishStringArray = z.nullish(z.array(z.string()));
const nullishString = z.nullish(z.string());
const nullishNumber = z.nullish(z.number());
const nullishBoolean = z.nullish(z.boolean());
const nullableStringArray = z.nullable(z.array(z.string()));
const nullableString = z.nullable(z.string());
const nullableNumber = z.nullable(z.number());
const nullableBoolean = z.nullable(z.boolean());
const leagueStatusEnum = z.enum([
    "pre_draft",
    "drafting",
    "in_season",
    "complete",
    "post_season",
]);
const playoffBracketTypeEnum = z.enum(["winners_bracket", "losers_bracket"]);
const nflStateEnum = z.enum(["pre", "regular", "post", "off"]);
const leagueStateEnum = z.enum(["regular", "post", "off"]);
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
export const rawLeagueUserSchema = z.looseObject({
    user_id: z.string(),
    metadata: z.looseObject({
        team_name: nullishString,
        avatar: nullishString,
    }),
    is_owner: nullishBoolean,
});
export const strictLeagueUserSchema = z.strictObject({
    userId: z.string(),
    leagueId: z.string(),
    teamName: nullableString,
    avatarId: nullableString,
    isOwner: nullableBoolean,
});
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
export const rawRosterSchema = z.looseObject({
    owner_id: z.string(),
    league_id: z.string(),
    roster_id: z.number(),
    starters: z.array(z.string()),
    settings: z.looseObject({
        division: z.number(),
        wins: z.number(),
        ties: z.number(),
        losses: z.number(),
        fpts_against: nullishNumber,
        fpts: z.number(),
    }),
    players: z.array(z.string()),
    reserve: nullishStringArray,
    metadata: z.nullish(z.looseObject({
        streak: nullishString,
        record: nullishString,
    })),
});
export const strictRosterSchema = z.strictObject({
    rosterOwnerId: z.string(),
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
    division: z.number(),
});
export const rawMatchupSchema = z.looseObject({
    points: z.number(),
    players: z.array(z.string()),
    roster_id: z.number(),
    matchup_id: nullishNumber, // NULL MATCHUP ID = BYE WEEK
    starters: z.array(z.string()),
    starters_points: z.array(z.number()),
    players_points: z.nullish(z.record(z.string(), z.number())),
});
export const strictMatchupSchema = z.strictObject({
    leagueId: z.string(),
    season: z.string(),
    week: z.number(),
    points: z.string(),
    players: z.array(z.string()),
    rosterId: z.number(),
    matchupId: nullableNumber, // NULL MATCHUP ID = BYE WEEK
    starters: z.array(z.string()),
    startersPoints: z.array(z.string()), // numeric type in postgres == string
    playersPoints: z.record(z.string(), z.string()),
});
const winningTeamFromMatchupSchema = z
    .looseObject({
    w: z.number(),
})
    .refine((data) => !("l" in data), { error: "l property must not exist" })
    .refine((data) => "w" in data, { error: "w property must exist" });
const losingTeamFromMatchupSchema = z
    .looseObject({
    l: z.number(),
})
    .refine((data) => !("w" in data), { error: "w property must not exist" })
    .refine((data) => "l" in data, { error: "l property must exist" });
const nullishTeamFromMatchupSchema = z.nullish(z.xor([winningTeamFromMatchupSchema, losingTeamFromMatchupSchema]));
export const nullableTeamFromMatchupSchema = z.nullable(z.xor([winningTeamFromMatchupSchema, losingTeamFromMatchupSchema]));
export const rawBracketMatchupSchema = z.looseObject({
    m: z.number(),
    r: z.number(),
    l: nullishNumber,
    w: nullishNumber,
    p: nullishNumber,
    t1: nullishNumber,
    t2: nullishNumber,
    t1_from: nullishTeamFromMatchupSchema,
    t2_from: nullishTeamFromMatchupSchema,
});
export const strictBracketMatchupSchema = z.strictObject({
    leagueId: z.string(),
    matchupId: nullableNumber,
    t1: nullableNumber,
    t2: nullableNumber,
    bracketType: playoffBracketTypeEnum,
    t1FromWinner: nullableNumber,
    t1FromLoser: nullableNumber,
    t2FromWinner: nullableNumber,
    t2FromLoser: nullableNumber,
    bracketMatchupId: z.number(),
    round: z.number(),
    loserId: nullableNumber,
    winnerId: nullableNumber,
    place: nullableNumber,
    week: z.number(),
});
// all of this data in this object is NFL RELATED NOT LEAGUE SETTINGS RELATED
// we will build our logic around this incoming raw data and build our league state
export const rawNFLStateSchema = z.looseObject({
    week: nullishNumber, // week
    leg: nullishNumber, // week of regular season
    season: z.string(), // current season
    season_type: nflStateEnum, // pre, post, regular
    league_season: z.string(), // active season for leagues
    previous_season: z.string(),
    season_start_date: nullishString, // regular season start
    display_week: nullishNumber, // Which week to display in UI, can be different than week
    league_create_season: z.string(), // flips in December
    season_has_scores: z.boolean(),
});
export const strictLeagueStateSchema = z.strictObject({
    id: z.number(),
    week: z.number(),
    leg: z.number(),
    season: z.string(),
    seasonType: leagueStateEnum,
    previousSeason: z.string(),
    displayWeek: z.number(),
    isLeagueActive: z.boolean(),
});
