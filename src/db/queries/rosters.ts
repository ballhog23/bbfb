import { sql, and, eq, desc } from "drizzle-orm";
import { db } from "../index.js";
import { leagueUsersTable, rostersTable, NFLPlayersTable, type StrictInsertRoster, sleeperUsersTable } from '../schema.js';

export async function insertLeagueRoster(leagueRosters: StrictInsertRoster) {
    const [result] = await db
        .insert(rostersTable)
        .values(leagueRosters)
        .onConflictDoUpdate({
            target: [rostersTable.leagueId, rostersTable.rosterId],
            set: {
                rosterOwnerId: sql`EXCLUDED.roster_owner_id`,
                season: sql`EXCLUDED.season`,
                starters: sql`EXCLUDED.starters`,
                wins: sql`EXCLUDED.wins`,
                ties: sql`EXCLUDED.ties`,
                losses: sql`EXCLUDED.losses`,
                fptsAgainst: sql`EXCLUDED.fpts_against`,
                fpts: sql`EXCLUDED.fpts`,
                reserve: sql`EXCLUDED.reserve`,
                players: sql`EXCLUDED.players`,
                streak: sql`EXCLUDED.streak`,
                record: sql`EXCLUDED.record`,
            }
        })
        .returning();

    return result;
}

// historical
export async function selectAllRosters() {
    const result = await db
        .select({
            userId: leagueUsersTable.userId,
            teamName: leagueUsersTable.teamName,
            season: rostersTable.season,
            wins: rostersTable.wins,
            losses: rostersTable.losses,
            players: sql
                `
                    jsonb_agg(
                        jsonb_build_object(
                            'playerName', ${NFLPlayersTable.firstName} || ' ' || ${NFLPlayersTable.lastName},
                            'position', ${NFLPlayersTable.position}
                        )
                    ) as player_metadata
                `,
        })
        .from(rostersTable)
        .innerJoin(leagueUsersTable,
            and(
                eq(rostersTable.leagueId, leagueUsersTable.leagueId),
                eq(rostersTable.rosterOwnerId, leagueUsersTable.userId)
            )
        )
        .innerJoin(NFLPlayersTable, sql`${NFLPlayersTable.playerId} = ANY(${rostersTable.players})`)
        .groupBy(
            leagueUsersTable.userId,
            leagueUsersTable.teamName,
            rostersTable.season,
            rostersTable.wins,
            rostersTable.losses
        )
        .orderBy(desc(rostersTable.season));

    return result;
}

// historical per user
export async function selectUserRosters(userId: string) {
    const result = await db
        .select({
            userId: leagueUsersTable.userId,
            teamName: leagueUsersTable.teamName,
            season: rostersTable.season,
            wins: rostersTable.wins,
            losses: rostersTable.losses,
            players: sql
                `
                    jsonb_agg(
                        jsonb_build_object(
                            'playerName', ${NFLPlayersTable.firstName} || ' ' || ${NFLPlayersTable.lastName},
                            'position', ${NFLPlayersTable.position}
                        )
                    ) as player_metadata
                `,
        })
        .from(rostersTable)
        .innerJoin(leagueUsersTable,
            and(
                eq(rostersTable.leagueId, leagueUsersTable.leagueId),
                eq(rostersTable.rosterOwnerId, leagueUsersTable.userId)
            )
        )
        .innerJoin(NFLPlayersTable, sql`${NFLPlayersTable.playerId} = ANY(${rostersTable.players})`)
        .where(eq(rostersTable.rosterOwnerId, userId))
        .groupBy(
            leagueUsersTable.userId,
            leagueUsersTable.teamName,
            rostersTable.season,
            rostersTable.wins,
            rostersTable.losses
        )
        .orderBy(desc(rostersTable.season));

    return result;
}

// per season
export async function selectLeagueRosters(leagueId: string) {
    const result = await db
        .select({
            userId: leagueUsersTable.userId,
            ownerName: sleeperUsersTable.displayName,
            teamName: leagueUsersTable.teamName,
            season: rostersTable.season,
            wins: rostersTable.wins,
            losses: rostersTable.losses,
            players: sql<{
                playerName: string;
                position: string;
                starter: boolean;
            }[]>
                `
                    jsonb_agg(
                        jsonb_build_object(
                            'playerName', ${NFLPlayersTable.firstName} || ' ' || ${NFLPlayersTable.lastName},
                            'position', ${NFLPlayersTable.position},
                            'starter', CASE
                                        WHEN ${NFLPlayersTable.playerId} = ANY(${rostersTable.starters}) THEN TRUE
                                        ELSE FALSE
                                        END

                        )
                    )
                `,
        })
        .from(rostersTable)
        .innerJoin(leagueUsersTable,
            and(
                eq(rostersTable.leagueId, leagueUsersTable.leagueId),
                eq(rostersTable.rosterOwnerId, leagueUsersTable.userId)
            )
        )
        .innerJoin(sleeperUsersTable,
            eq(rostersTable.rosterOwnerId, sleeperUsersTable.userId),
        )
        .innerJoin(NFLPlayersTable, sql`${NFLPlayersTable.playerId} = ANY(${rostersTable.players})`)
        .where(eq(rostersTable.leagueId, leagueId))
        .groupBy(
            leagueUsersTable.userId,
            sleeperUsersTable.displayName,
            leagueUsersTable.teamName,
            rostersTable.season,
            rostersTable.wins,
            rostersTable.losses
        );

    return result;
}

// per season per user
export async function selectLeagueUserRoster(leagueId: string, userId: string) {
    const result = await db
        .select({
            userId: leagueUsersTable.userId,
            teamName: leagueUsersTable.teamName,
            season: rostersTable.season,
            wins: rostersTable.wins,
            losses: rostersTable.losses,
            rosterId: rostersTable.rosterId,
            players: sql
                `
                    jsonb_agg(
                        jsonb_build_object(
                            'playerName', ${NFLPlayersTable.firstName} || ' ' || ${NFLPlayersTable.lastName},
                            'position', ${NFLPlayersTable.position}
                        )
                    ) as player_metadata
                `
        })
        .from(rostersTable)
        .innerJoin(leagueUsersTable,
            and(
                eq(rostersTable.leagueId, leagueUsersTable.leagueId),
                eq(rostersTable.rosterOwnerId, leagueUsersTable.userId)
            )
        )
        .innerJoin(NFLPlayersTable, sql`${NFLPlayersTable.playerId} = ANY(${rostersTable.players})`)
        .where(
            and(
                eq(rostersTable.leagueId, leagueId),
                eq(rostersTable.rosterOwnerId, userId)
            )
        )
        .groupBy(
            leagueUsersTable.userId,
            leagueUsersTable.teamName,
            rostersTable.season,
            rostersTable.wins,
            rostersTable.losses,
            rostersTable.rosterId,
        );
    return result;
}