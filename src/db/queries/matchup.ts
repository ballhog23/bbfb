import { sql, and, eq, desc, isNotNull } from "drizzle-orm";
import { db } from "../index.js";
import {
    leagueUsersTable, matchupsTable,
    rostersTable, NFLPlayersTable,
    type StrictInsertMatchup,
    sleeperUsersTable
} from "../schema.js";

export async function insertMatchup(matchup: StrictInsertMatchup) {
    const [result] = await db
        .insert(matchupsTable)
        .values(matchup)
        .onConflictDoUpdate({
            target: [
                matchupsTable.leagueId,
                matchupsTable.rosterId,
                matchupsTable.week
            ],
            set: {
                season: sql`EXCLUDED.season`,
                points: sql`EXCLUDED.points`,
                players: sql`EXCLUDED.players`,
                matchupId: sql`EXCLUDED.matchup_id`,
                starters: sql`EXCLUDED.starters`,
                startersPoints: sql`EXCLUDED.starters_points`,
                playersPoints: sql`EXCLUDED.players_points`,
            }
        })
        .returning();

    return result;
}

export async function selectLeagueMatchups(leagueId: string) {
    const result = await db
        .select({
            season: matchupsTable.season,
            week: matchupsTable.week,
            matchupId: matchupsTable.matchupId,
            team: leagueUsersTable.teamName,
            owner: sleeperUsersTable.displayName,
            pointsTotal: matchupsTable.points,
            players: sql
                `
                    jsonb_agg(
                        CASE 
                            WHEN player_scoring.player_id = ANY(${matchupsTable.starters}) 
                            THEN jsonb_build_object(
                                    'playerName', ${NFLPlayersTable.firstName} || ' ' || ${NFLPlayersTable.lastName},
                                    'position', ${NFLPlayersTable.position},
                                    'points', player_scoring.points,
                                    'starter', TRUE
                            )
                            ELSE jsonb_build_object(
                                    'playerName', ${NFLPlayersTable.firstName} || ' ' || ${NFLPlayersTable.lastName},
                                    'position', ${NFLPlayersTable.position},
                                    'points', player_scoring.points,
                                    'starter', FALSE
                            )
                        END
                    )   
                `,

        })
        .from(matchupsTable)
        .innerJoin(rostersTable, and(
            eq(rostersTable.leagueId, leagueId),
            eq(rostersTable.rosterId, matchupsTable.rosterId)
        ))
        .innerJoin(leagueUsersTable, and(
            eq(leagueUsersTable.leagueId, leagueId),
            eq(rostersTable.rosterOwnerId, leagueUsersTable.userId)
        ))
        .leftJoinLateral(
            sql`jsonb_each_text(${matchupsTable.playersPoints}) as player_scoring(player_id, points)`,
            sql`TRUE`
        )
        .innerJoin(NFLPlayersTable, eq(NFLPlayersTable.playerId, sql`player_scoring.player_id`))
        .innerJoin(sleeperUsersTable, eq(leagueUsersTable.userId, sleeperUsersTable.userId))
        .where(
            eq(matchupsTable.leagueId, leagueId)
        )
        .groupBy(
            matchupsTable.season,
            matchupsTable.week,
            matchupsTable.matchupId,
            leagueUsersTable.teamName,
            sleeperUsersTable.displayName,
            matchupsTable.points,
        )
        .orderBy(matchupsTable.week, matchupsTable.matchupId);

    return result;
}

export async function selectLeagueMatchupsByWeek(leagueId: string, week: number) {
    const result = await db
        .select({
            season: matchupsTable.season,
            week: matchupsTable.week,
            matchupId: matchupsTable.matchupId,
            team: leagueUsersTable.teamName,
            owner: sleeperUsersTable.displayName,
            points: matchupsTable.points,
            rosterPlayers: sql
                `
                    jsonb_agg(
                        CASE 
                            WHEN player_scoring.player_id = ANY(${matchupsTable.starters}) 
                            THEN jsonb_build_object(
                                    'playerName', ${NFLPlayersTable.firstName} || ' ' || ${NFLPlayersTable.lastName},
                                    'position', ${NFLPlayersTable.position},
                                    'points', player_scoring.points,
                                    'starter', TRUE
                            )
                            ELSE jsonb_build_object(
                                    'playerName', ${NFLPlayersTable.firstName} || ' ' || ${NFLPlayersTable.lastName},
                                    'position', ${NFLPlayersTable.position},
                                    'points', player_scoring.points,
                                    'starter', FALSE
                            )
                        END
                    )   
                `,

        })
        .from(matchupsTable)
        .innerJoin(rostersTable,
            and(
                eq(rostersTable.leagueId, leagueId),
                eq(matchupsTable.rosterId, rostersTable.rosterId)
            )
        )
        .innerJoin(leagueUsersTable,
            and(
                eq(leagueUsersTable.leagueId, leagueId),
                eq(leagueUsersTable.userId, rostersTable.rosterOwnerId,)
            )
        )
        .leftJoinLateral(
            sql`jsonb_each_text(${matchupsTable.playersPoints}) as player_scoring(player_id, points)`,
            sql`TRUE`
        )
        .innerJoin(NFLPlayersTable, eq(NFLPlayersTable.playerId, sql`player_scoring.player_id`))
        .innerJoin(sleeperUsersTable, eq(sleeperUsersTable.userId, rostersTable.rosterOwnerId))
        .where(
            and(
                eq(matchupsTable.leagueId, leagueId),
                eq(matchupsTable.week, week)
            )
        )
        .groupBy(
            matchupsTable.season,
            matchupsTable.week,
            matchupsTable.matchupId,
            leagueUsersTable.teamName,
            sleeperUsersTable.displayName,
            matchupsTable.points,
        )
        .orderBy(matchupsTable.matchupId);

    return result;
}

export async function selectSpecificLeagueMatchup(leagueId: string, week: number, matchupId: number,) {
    const result = await db
        .select({
            season: matchupsTable.season,
            week: matchupsTable.week,
            matchupId: matchupsTable.matchupId,
            team: leagueUsersTable.teamName,
            owner: sleeperUsersTable.displayName,
            pointsTotal: matchupsTable.points,
            rosterPlayers: sql
                `
                    jsonb_agg(
                        CASE 
                            WHEN player_scoring.player_id = ANY(${matchupsTable.starters}) 
                            THEN jsonb_build_object(
                                    'playerName', ${NFLPlayersTable.firstName} || ' ' || ${NFLPlayersTable.lastName},
                                    'position', ${NFLPlayersTable.position},
                                    'points', player_scoring.points,
                                    'starter', TRUE
                            )
                            ELSE jsonb_build_object(
                                    'playerName', ${NFLPlayersTable.firstName} || ' ' || ${NFLPlayersTable.lastName},
                                    'position', ${NFLPlayersTable.position},
                                    'points', player_scoring.points,
                                    'starter', FALSE
                            )
                        END
                    )   
                `,

        })
        .from(matchupsTable)
        .innerJoin(rostersTable, and(
            eq(rostersTable.leagueId, leagueId),
            eq(rostersTable.rosterId, matchupsTable.rosterId)
        ))
        .innerJoin(leagueUsersTable, and(
            eq(leagueUsersTable.leagueId, leagueId),
            eq(rostersTable.rosterOwnerId, leagueUsersTable.userId)
        ))
        .leftJoinLateral(
            sql`jsonb_each_text(${matchupsTable.playersPoints}) as player_scoring(player_id, points)`,
            sql`TRUE`
        )
        .innerJoin(NFLPlayersTable, eq(NFLPlayersTable.playerId, sql`player_scoring.player_id`))
        .innerJoin(sleeperUsersTable, eq(rostersTable.rosterOwnerId, sleeperUsersTable.userId))
        .where(
            and(
                eq(matchupsTable.leagueId, leagueId),
                eq(matchupsTable.matchupId, matchupId),
                eq(matchupsTable.week, week)
            )
        )
        .groupBy(
            matchupsTable.season,
            matchupsTable.week,
            matchupsTable.matchupId,
            leagueUsersTable.teamName,
            sleeperUsersTable.displayName,
            matchupsTable.points,
        );

    return result;
}