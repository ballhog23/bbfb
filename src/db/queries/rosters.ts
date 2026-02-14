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
                division: sql`EXCLUDED.division`
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

// using on matchups page, for standings
export async function selectLeagueRosters(leagueId: string) {
    const playerJson = sql<{
        playerName: string;
        position: string;
        team: string | null;
        playerImage: string;
    }>`
        jsonb_build_object(
            'playerName', ${NFLPlayersTable.firstName} || ' ' || ${NFLPlayersTable.lastName},
            'position', ${NFLPlayersTable.position},
            'team', ${NFLPlayersTable.team},
            'playerImage', CASE
                WHEN ${NFLPlayersTable.position} = 'DEF' THEN 'https://sleepercdn.com/images/team_logos/nfl/' || lower(nfl_players.team) || '.png'
                ELSE 'https://sleepercdn.com/content/nfl/players/' || nfl_players.player_id || '.jpg'
                END
        )
    `;

    const result = await db
        .select({
            ownerName: sleeperUsersTable.displayName,
            ownerImage: sleeperUsersTable.avatarId,
            teamName: leagueUsersTable.teamName,
            teamImage: leagueUsersTable.avatarId,
            pointsFor: rostersTable.fpts,
            pointsAgainst: rostersTable.fptsAgainst,
            wins: rostersTable.wins,
            losses: rostersTable.losses,
            startingRoster: sql<(typeof playerJson)[] | null>`
                jsonb_agg(
                    ${playerJson}
                    
                    ORDER BY array_position(${rostersTable.starters}, ${NFLPlayersTable.playerId})
                )
                FILTER (WHERE ${NFLPlayersTable.playerId} = ANY(${rostersTable.starters}))
            `,
            reserveRoster: sql<(typeof playerJson)[] | null>`
                jsonb_agg(${playerJson})
                FILTER (
                    WHERE ${rostersTable.reserve} IS NOT NULL
                    AND ${NFLPlayersTable.playerId} = ANY(${rostersTable.reserve})
                )
            `,
            benchRoster: sql<(typeof playerJson)[] | null>`
                jsonb_agg(${playerJson})
                FILTER (
                    WHERE ${NFLPlayersTable.playerId} = ANY(${rostersTable.players})
                    AND ${NFLPlayersTable.playerId} <> ALL(${rostersTable.starters})
                    AND (${rostersTable.reserve} IS NULL OR ${NFLPlayersTable.playerId} <> ALL(${rostersTable.reserve}))
                )
            `,
        })
        .from(rostersTable)
        .innerJoin(
            leagueUsersTable,
            and(
                eq(rostersTable.leagueId, leagueUsersTable.leagueId),
                eq(rostersTable.rosterOwnerId, leagueUsersTable.userId)
            )
        )
        .innerJoin(
            sleeperUsersTable,
            eq(rostersTable.rosterOwnerId, sleeperUsersTable.userId)
        )
        .innerJoin(
            NFLPlayersTable,
            sql`${NFLPlayersTable.playerId} = ANY(${rostersTable.players})`
        )
        .where(eq(rostersTable.leagueId, leagueId))
        .groupBy(
            sleeperUsersTable.displayName,
            sleeperUsersTable.avatarId,
            leagueUsersTable.teamName,
            leagueUsersTable.avatarId,
            rostersTable.fpts,
            rostersTable.fptsAgainst,
            rostersTable.wins,
            rostersTable.losses,
        )
        .orderBy(
            desc(rostersTable.wins),
            desc(rostersTable.fpts),
            desc(rostersTable.fptsAgainst),
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