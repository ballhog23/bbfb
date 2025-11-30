import { pgTable, timestamp, text, boolean, integer } from "drizzle-orm/pg-core";
import { type LeagueUser } from "../lib/zod.js";

const timestamps = {
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
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
export type InsertNFLPlayer = Omit<SelectNFLPlayer, "createdAt" | "updatedAt"> & Timestamps;

export type RefinedMatchup = {
    starters: string[];
    rosterId: number;
    players: string[];
    matchupId: number;
    points: number;
    customPoints: number | null;
};

type Timestamps = {
    createdAt?: Date;
    updatedAt?: Date;
};