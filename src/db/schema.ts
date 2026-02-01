import { foreignKey, pgEnum, primaryKey } from "drizzle-orm/pg-core";
import { pgTable, timestamp, text, boolean, integer, unique, jsonb, numeric } from "drizzle-orm/pg-core";
import type { NullableTeamFromMatchup } from "../lib/zod.js";

const timestamps = {
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
};

type OmitTimestamps<T> = Omit<T, "createdAt" | "updatedAt">;

/**
 * enforcing unique season constraint on leagues table for now...
 * if we ever integrate other leagues into this table we could remove the constraint
 * currently we are supporting only the annual redraft league, we could add support of our dynasty but is doubtful
 */
export const leaguesTable = pgTable("leagues", {
    leagueId: text().primaryKey().notNull(),
    status: text().notNull(),
    season: text().notNull(),
    leagueName: text().notNull(),
    avatarId: text().notNull(),
    previousLeagueId: text(),
    draftId: text().notNull(),
    rosterPositions: text().array().notNull(),
    totalRosters: integer().notNull(),
    ...timestamps
}, (t) => [
    unique().on(t.season)
]);
export type SelectLeague = typeof leaguesTable.$inferSelect;
export type StrictInsertLeague = OmitTimestamps<SelectLeague>;

export const sleeperUsersTable = pgTable("sleeper_users", {
    userId: text().primaryKey().notNull(),
    userName: text().notNull(),
    displayName: text().notNull(),
    avatarId: text().notNull(),
    ...timestamps
});
export type SelectSleeperUser = typeof sleeperUsersTable.$inferSelect;
export type StrictInsertSleeperUser = OmitTimestamps<SelectSleeperUser>;

export const leagueUsersTable = pgTable("league_users", {
    userId: text()
        .references(() => sleeperUsersTable.userId)
        .notNull(),
    leagueId: text()
        .references(() => leaguesTable.leagueId)
        .notNull(),
    avatarId: text(),
    teamName: text(),
    isOwner: boolean(),
    ...timestamps
}, (table) => [
    primaryKey({ name: "league_user_identity", columns: [table.userId, table.leagueId] })
]);

export type SelectLeagueUser = typeof leagueUsersTable.$inferSelect;
export type StrictInsertLeagueUser = OmitTimestamps<SelectLeagueUser>;

// a cool feature will be to extract all player nicknames from league rosters
// tie them to id here, and store as array of strings
export const NFLPlayersTable = pgTable("nfl_players", {
    playerId: text().primaryKey().notNull(),
    firstName: text().notNull(),
    lastName: text().notNull(),
    active: boolean().notNull(),
    fantasyPositions: text().array(),
    position: text(),
    team: text(),
    number: integer(),
    age: integer(),
    injuryStatus: text(),
    ...timestamps
});

export type SelectNFLPlayer = typeof NFLPlayersTable.$inferSelect;
export type StrictInsertNFLPlayer = OmitTimestamps<SelectNFLPlayer>;

export const rostersTable = pgTable("rosters", {
    rosterOwnerId: text().references(() => sleeperUsersTable.userId).notNull(),
    leagueId: text().notNull(),
    season: text().notNull(),
    rosterId: integer().notNull(),
    starters: text().array().notNull(),
    wins: integer().notNull(),
    ties: integer().notNull(),
    losses: integer().notNull(),
    fptsAgainst: integer().notNull(),
    fpts: integer().notNull(),
    players: text().array().notNull(),
    reserve: text().array(),
    streak: text(), // W or L streak e.g, '3W', could possibly be empty string week 1
    record: text(), // represented as a string WLLWL... etc, just an example. could be same as above ^
    ...timestamps
}, (table) => [
    primaryKey({ name: "roster_identity", columns: [table.leagueId, table.rosterId] })
]
);

export type SelectRoster = typeof rostersTable.$inferSelect;
export type StrictInsertRoster = OmitTimestamps<SelectRoster>;

export const matchupsTable = pgTable("matchups", {
    leagueId: text()
        .notNull(),
    season: text().notNull(),
    week: integer().notNull(),
    points: numeric({ scale: 2 }).notNull(),
    players: text().array().notNull(),
    rosterId: integer()
        .notNull(),
    matchupId: integer(), // NULL MATCHUP ID === BYE WEEK
    starters: text().array().notNull(),
    startersPoints: numeric({ scale: 2 }).array().notNull(),
    playersPoints: jsonb().$type<Record<string, string>>().notNull(),
    ...timestamps
}, (table) => [
    primaryKey({
        name: "matchups_identity",
        columns: [table.leagueId, table.rosterId, table.week]
    }),
    foreignKey({
        name: "league_rosters_identity",
        columns: [table.leagueId, table.rosterId],
        foreignColumns: [rostersTable.leagueId, rostersTable.rosterId]
    })
]);

export type SelectMatchup = typeof matchupsTable.$inferSelect;
export type StrictInsertMatchup = OmitTimestamps<SelectMatchup>;

export const resultEnum = pgEnum('result', ['W', 'L', 'T', 'BYE']);
export const matchupOutcomesTable = pgTable("matchup_outcomes", {
    leagueId: text().notNull(),
    matchupId: integer(),
    week: integer().notNull(),
    rosterId: integer().notNull(),
    rosterOwnerId: text().references(() => sleeperUsersTable.userId).notNull(), // this references rostersTable.ownerId
    outcome: resultEnum().notNull(),
    season: text().notNull(),
    pointsFor: numeric({ scale: 2 }).notNull(),
    pointsAgainst: numeric({ scale: 2 }),
    ...timestamps
}, (table) => [
    primaryKey({
        name: "matchup_outcome_identity",
        columns: [
            table.leagueId,
            table.rosterOwnerId,
            table.week,
            table.rosterId
        ]
    }),
    foreignKey({
        name: "matchups_league_rosters_identity",
        columns: [table.leagueId, table.rosterId],
        foreignColumns: [rostersTable.leagueId, rostersTable.rosterId]
    })
]
);

export type SelectMatchupOutcome = typeof matchupOutcomesTable.$inferSelect;
export type StrictInsertMatchupOutcome = OmitTimestamps<SelectMatchupOutcome>;

export const playoffsTable = pgTable("playoff_bracket_matchups", {
    leagueId: text()
        .references(() => leaguesTable.leagueId)
        .notNull(),
    bracketType: text().notNull(),
    bracketMatchupId: integer().notNull(),
    matchupId: integer(), // points at matchups table or null if bye week
    week: integer().notNull(),
    round: integer().notNull(),
    loserId: integer(),
    winnerId: integer(),
    place: integer(), // null in first round
    t1: integer(),
    t2: integer(),
    t1FromWinner: integer(),
    t1FromLoser: integer(),
    t2FromWinner: integer(),
    t2FromLoser: integer(),
    ...timestamps
}, (table) => [
    primaryKey({
        name: "playoff_bracket_matchups_identity",
        columns: [
            table.leagueId,
            table.bracketType,
            table.bracketMatchupId,
        ]
    })
]);

export type SelectPlayoffMatchup = typeof playoffsTable.$inferSelect;
export type StrictInsertPlayoffMatchup = OmitTimestamps<SelectPlayoffMatchup>;

export const seasonTypeEnum = pgEnum('season_type', ['regular', 'post', 'off']);
export const leagueStateTable = pgTable("league_state", {
    week: integer().notNull(),
    leg: integer().notNull(),
    season: text().notNull().unique('league_season'),
    seasonType: seasonTypeEnum().notNull(),
    previousSeason: text().notNull(),
    displayWeek: integer().notNull(),
    isLeagueActive: boolean().notNull(),
    ...timestamps
});

export type SelectLeagueState = typeof leagueStateTable.$inferSelect;
export type StrictInsertLeagueState = OmitTimestamps<SelectLeagueState>;