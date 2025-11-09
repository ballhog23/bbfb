import { RefinedNFLPlayer, type RefinedLeagueUser } from "../lib/zod.js";
import { pgTable, timestamp, text, boolean, integer } from "drizzle-orm/pg-core";

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
export type InsertLeagueUser = RefinedLeagueUser & Timestamps;

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

export type SelectNFLPlayer = typeof NFLPlayersTable.$inferSelect;
export type InsertNFLPlayer = RefinedNFLPlayer & Timestamps;
