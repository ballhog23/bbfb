import { primaryKey } from "drizzle-orm/pg-core";
import { pgTable, timestamp, text, boolean, integer, uuid, unique } from "drizzle-orm/pg-core";

const timestamps = {
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
};

type Timestamps = {
    createdAt?: Date;
    updatedAt?: Date;
};

/**
 * enforcing unique constraint on leagues table for now...
 * if we ever integrate other leagues into this table we could remove the constraint
 * currently we are supporting only the annual redraft league, we could add support of dynasty but is doubtful
 */
export const leaguesTable = pgTable("leagues", {
    leagueId: text().primaryKey().notNull(),
    status: boolean().notNull(),
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
export type InsertLeague = typeof leaguesTable.$inferInsert;

export const usersTable = pgTable("users", {
    userId: text().primaryKey().notNull(),
    displayName: text().notNull(),
    teamName: text(),
    avatarId: text().notNull(),
    isActive: boolean().notNull(),
    ...timestamps
});

export type SelectLeagueUser = typeof usersTable.$inferSelect;
export type StrictInsertLeagueUser = Omit<SelectLeagueUser, "createdAt" | "updatedAt">;
export type InsertLeagueUser = {
    userId: string;
    displayName?: string;
    teamName?: string | null;
    avatarId?: string;
    isActive?: boolean;
};


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

/**
 * Initially considered using `rosterId` as the primary key, but it's a number 1-12 for every season, so not globally unique.
 * One idea was to prefix the year when normalizing data for insertion, but `rosterId` is also used in the playoff bracket, making that tricky.
 * Using a UUID was considered, but this is a bad idea because it breaks the natural identity of the roster.
 * Instead, we define a composite primary key. 
 * Analogy: A house is defined by its address, not its occupant.
 * Similarly, a roster is uniquely identified by its league (`leagueId`) and its slot (`rosterId`), independent of `ownerId`.
 */
export const rostersTable = pgTable("rosters", {
    ownerId: text()
        .references(() => usersTable.userId, { onDelete: "cascade" })
        .notNull(),
    leagueId: text()
        .references(() => leaguesTable.leagueId, { onDelete: "cascade" })
        .notNull(),
    season: text().notNull(),
    rosterId: integer().notNull(),
    starters: text().array().notNull(), // curious as to what happens if someone does not have any starters in lineup
    wins: integer().notNull(),
    ties: integer().notNull(),
    losses: integer().notNull(),
    fptsAgainst: integer().notNull(),
    fpts: integer().notNull(),
    reserve: text().array(),
    players: text().array().notNull(),
    streak: text(), // not sure if sleeper always sends back a value here
    record: text(), // not sure if sleeper always sends back a value here
    ...timestamps
}, (table) => [
    primaryKey({ name: "roster_identity", columns: [table.leagueId, table.rosterId] })
]
);

export type SelectRoster = typeof rostersTable.$inferSelect;
// NORMALIZED Sleeper API result (missing season + id)
export type SleeperRoster = Omit<InsertRoster, "season">;
export type InsertRoster = Omit<SelectRoster, "createdAt" | "updatedAt"> & Timestamps;


export type SelectNFLPlayer = typeof NFLPlayersTable.$inferSelect;
export type InsertNFLPlayer = Omit<SelectNFLPlayer, "createdAt" | "updatedAt"> & Timestamps;

export type RefinedMatchup = {
    starters: string[];
    rosterId: number;
    players: string[];
    matchupId: number;
    points: number;
    customPoints: number | null;
};