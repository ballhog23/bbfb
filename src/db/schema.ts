import { pgTable, timestamp, text, boolean, integer, uuid, unique } from "drizzle-orm/pg-core";

const timestamps = {
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
};

type Timestamps = {
    createdAt?: Date;
    updatedAt?: Date;
};

export const usersTable = pgTable("users", {
    userId: text().primaryKey().notNull(),
    displayName: text().notNull(),
    teamName: text(),
    avatarId: text().notNull(),
    ...timestamps
});

export type SelectLeagueUser = typeof usersTable.$inferSelect;
export type InsertLeagueUser = Omit<SelectLeagueUser, "createdAt" | "updatedAt"> & Timestamps;
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
    ...timestamps
});

// would have used rosterId as pk but its a digit 1-12 for every season, so it's not unique
// option was to prefix the year when normalizing the data for insertion but the rosterId
// is also used in the playoff bracket, so lets just generate uuid
export const rostersTable = pgTable("rosters", {
    id: uuid().primaryKey().notNull(),
    ownerId: text()
        .references(() => usersTable.userId, { onDelete: "cascade" })
        .notNull(),
    leagueId: text()
        .references(() => leaguesTable.leagueId, { onDelete: "cascade" })
        .notNull(),
    season: text().notNull(),
    rosterId: integer().notNull(),
    starters: text().array(),
    wins: integer().notNull(),
    ties: integer().notNull(),
    losses: integer().notNull(),
    fptsAgainst: integer().notNull(),
    fpts: integer().notNull(),
    reserve: text().array(),
    players: text().array().notNull(),
    streak: text(),
    record: text(),
    ...timestamps
});

export type SelectRoster = typeof rostersTable.$inferSelect;
export type InsertRoster = Omit<SelectRoster, "id" | "createdAt" | "updatedAt"> & Timestamps;

export type SelectNFLPlayer = typeof NFLPlayersTable.$inferSelect;
export type InsertNFLPlayer = Omit<SelectNFLPlayer, "createdAt" | "updatedAt"> & Timestamps;

export const leaguesTable = pgTable("leagues", {
    leagueId: text().primaryKey().notNull(),
    status: boolean().notNull(),
    season: text().notNull(),
    leagueName: text().notNull(),
    avatarId: text().notNull(),
    previousLeagueId: text(),
    rosterPositions: text().array().notNull(),
    totalRosters: integer().notNull(),
    ...timestamps
}, (t) => [
    unique().on(t.season)
]);

export type SelectLeague = typeof leaguesTable.$inferSelect;
export type InsertLeague = Omit<SelectLeague, "createdAt" | "updatedAt"> & Timestamps;

export type RefinedMatchup = {
    starters: string[];
    rosterId: number;
    players: string[];
    matchupId: number;
    points: number;
    customPoints: number | null;
};