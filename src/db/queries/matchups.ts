import { sql, and, eq, gte, isNotNull, isNull } from "drizzle-orm";
import { db } from "../index.js";
import {
    leagueUsersTable, matchupsTable,
    rostersTable, NFLPlayersTable,
    type StrictInsertMatchup,
    sleeperUsersTable,
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
            teamImage: leagueUsersTable.avatarId,
            owner: sleeperUsersTable.displayName,
            ownerImage: sleeperUsersTable.avatarId,
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
            leagueUsersTable.avatarId,
            sleeperUsersTable.avatarId,
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

// using!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
export async function selectLeagueMatchupsByWeekWithoutByes(
    leagueId: string,
    week: number
) {
    const playerJson = sql<{
        playerName: string;
        position: string;
        points: string | null;
        team: string;
    }>`
        jsonb_build_object(
            'playerName', ${NFLPlayersTable.firstName} || ' ' || ${NFLPlayersTable.lastName},
            'position', ${NFLPlayersTable.position},
            'points', player_scoring.points,
            'team', ${NFLPlayersTable.team},
            'playerImage', CASE
                WHEN ${NFLPlayersTable.position} = 'DEF' THEN 'https\://sleepercdn.com/images/team_logos/nfl/' || lower(nfl_players.team) || '.png'
                ELSE 'https://sleepercdn.com/content/nfl/players/' || nfl_players.player_id || '.jpg'
                END
        )
    `;

    const result = await db
        .select({
            season: matchupsTable.season,
            week: matchupsTable.week,
            matchupId: matchupsTable.matchupId,
            team: leagueUsersTable.teamName,
            teamImage: leagueUsersTable.avatarId,
            owner: sleeperUsersTable.displayName,
            ownerImage: sleeperUsersTable.avatarId,
            points: matchupsTable.points,
            startingRoster: sql<(typeof playerJson)[] | null>`
                jsonb_agg(${playerJson} ORDER BY array_position(${matchupsTable.starters}, ${NFLPlayersTable.playerId}))
                FILTER (
                    WHERE ${NFLPlayersTable.playerId} = ANY(${matchupsTable.starters})
                )
            `,
            benchRoster: sql<(typeof playerJson)[] | null>`
                jsonb_agg(${playerJson})
                FILTER (
                    WHERE ${NFLPlayersTable.playerId} = ANY(${matchupsTable.players})
                    AND ${NFLPlayersTable.playerId} <> ALL(${matchupsTable.starters})
                )
            `,
            reserveRoster: sql<null>`NULL`, // we could support snapshotting IR at time of matchup but not now
        })
        .from(matchupsTable)
        .innerJoin(
            NFLPlayersTable,
            sql`${NFLPlayersTable.playerId} = ANY(${matchupsTable.players})`
        )
        .leftJoinLateral(
            sql`
                jsonb_each_text(${matchupsTable.playersPoints})
                AS player_scoring(player_id, points)
            `,
            sql`${NFLPlayersTable.playerId} = player_scoring.player_id`
        )
        .innerJoin(
            rostersTable,
            and(
                eq(matchupsTable.leagueId, rostersTable.leagueId),
                eq(matchupsTable.rosterId, rostersTable.rosterId)
            )
        )
        .innerJoin(
            leagueUsersTable,
            and(
                eq(leagueUsersTable.leagueId, leagueId),
                eq(leagueUsersTable.userId, rostersTable.rosterOwnerId)
            )
        )
        .innerJoin(
            sleeperUsersTable,
            eq(sleeperUsersTable.userId, rostersTable.rosterOwnerId)
        )
        .where(
            and(
                eq(matchupsTable.leagueId, leagueId),
                eq(matchupsTable.week, week),
                isNotNull(matchupsTable.matchupId)
            )
        )
        .groupBy(
            matchupsTable.season,
            matchupsTable.week,
            matchupsTable.matchupId,
            leagueUsersTable.avatarId,
            sleeperUsersTable.avatarId,
            leagueUsersTable.teamName,
            sleeperUsersTable.displayName,
            matchupsTable.points
        )
        .orderBy(
            matchupsTable.season,
            matchupsTable.week,
            matchupsTable.matchupId
        );

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

// used to help populate playoffs_bracket_matchups table
// select all actual head-to-heads, select all bye 'matchups_id is null' union all
export async function selectPlayoffMatchups() {
    const real = db
        .select({
            leagueId: matchupsTable.leagueId,
            matchupId: matchupsTable.matchupId,
            season: matchupsTable.season,
            week: matchupsTable.week,
            homeTeam: sql<number>`MIN(${matchupsTable.rosterId})`.as('homeTeam'),
            awayTeam: sql<number | null>`MAX(${matchupsTable.rosterId})`.as('awayTeam'),
            isBye: sql<boolean>`FALSE`
        })
        .from(matchupsTable)
        .where(
            and(
                isNotNull(matchupsTable.matchupId),
                gte(matchupsTable.week, 15)
            )
        )
        .groupBy(
            matchupsTable.leagueId,
            matchupsTable.matchupId,
            matchupsTable.season,
            matchupsTable.week
        );

    const byes = db
        .select({
            leagueId: matchupsTable.leagueId,
            matchupId: matchupsTable.matchupId,
            season: matchupsTable.season,
            week: matchupsTable.week,
            homeTeam: matchupsTable.rosterId,
            awayTeam: sql<number | null>`NULL::integer`.as('awayTeam'),
            isBye: sql<boolean>`TRUE`
        })
        .from(matchupsTable)
        .where(
            and(
                isNull(matchupsTable.matchupId),
                gte(matchupsTable.week, 15)
            )
        );

    const unionQuery = real
        .unionAll(byes)
        .orderBy(
            sql`league_id`,
            sql`week ASC`,
            sql`matchup_id ASC NULLS LAST`,
            sql`"homeTeam" ASC`
        );

    const result = await unionQuery;

    return result;
}

export type TempPlayoffMatchupRow = Awaited<
    ReturnType<typeof selectPlayoffMatchups>
>[number];