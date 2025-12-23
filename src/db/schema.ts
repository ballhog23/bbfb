import { primaryKey } from "drizzle-orm/pg-core";
import { pgTable, timestamp, text, boolean, integer, unique } from "drizzle-orm/pg-core";

const timestamps = {
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
};

/**
 * enforcing unique constraint on leagues table for now...
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
export type StrictInsertLeague = Omit<SelectLeague, "createdAt" | "updatedAt">;

export const sleeperUsersTable = pgTable("sleeper_users", {
    userId: text().primaryKey().notNull(),
    userName: text().notNull(),
    displayName: text().notNull(),
    avatarId: text().notNull(),
    ...timestamps
});
export type SelectSleeperUser = typeof sleeperUsersTable.$inferSelect;
export type StrictInsertSleeperUser = Omit<SelectSleeperUser, "createdAt" | "updatedAt">;

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
export type StrictInsertLeagueUser = Omit<SelectLeagueUser, "createdAt" | "updatedAt">;

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
export type StrictInsertNFLPlayer = Omit<SelectNFLPlayer, "createdAt" | "updatedAt">;

/**
 * Initially considered using `rosterId` as the primary key, but it's a number 1-12 for every season, so not globally unique.
 * One idea was to prefix the year when normalizing data for insertion, but `rosterId` is also used in the playoff bracket, making that tricky.
 * Using a UUID was considered, but this is a bad idea because it breaks the natural identity of the roster.
 * Instead, we define a composite primary key. 
 * Analogy: A house is defined by its address, not its occupant.
 * Similarly, a roster is uniquely identified by its league (`leagueId`) and its slot (`rosterId`), independent of `ownerId`.
 * we should also look into writing a postgres trigger for if a rosters ownerId is changed
*/
export const rostersTable = pgTable("rosters", {
    ownerId: text()
        .references(() => sleeperUsersTable.userId) // we don't onDelete cascade here, because the whole point is to preserve history
        .notNull(),
    leagueId: text()
        .references(() => leaguesTable.leagueId) // we don't onDelete cascade here, because the whole point is to preserve history
        .notNull(),
    season: text().notNull(),
    rosterId: integer().notNull(),
    starters: text().array().notNull(), // if someone doesn't have any starters this could be empty array
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
export type StrictInsertRoster = Omit<SelectRoster, "createdAt" | "updatedAt">;