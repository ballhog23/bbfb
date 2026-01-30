import { sql, eq, and, desc } from "drizzle-orm";
import { db } from "../index.js";
import {
    leagueUsersTable, matchupsTable, sleeperUsersTable,
    playoffsTable, rostersTable, NFLPlayersTable,
    type StrictInsertPlayoffMatchup
} from "../schema.js";

export async function insertPlayoffMatchup(matchup: StrictInsertPlayoffMatchup) {
    const [result] = await db
        .insert(playoffsTable)
        .values(matchup)
        .onConflictDoUpdate({
            target: [
                playoffsTable.leagueId,
                playoffsTable.bracketType,
                playoffsTable.bracketMatchupId
            ],
            set: {
                matchupId: sql`EXCLUDED.matchup_id`,
                week: sql`EXCLUDED.week`,
                round: sql`EXCLUDED.round`,
                loserId: sql`EXCLUDED.loser_id`,
                winnerId: sql`EXCLUDED.winner_id`,
                place: sql`EXCLUDED.place`,
                t1: sql`EXCLUDED.t1`,
                t2: sql`EXCLUDED.t2`,
                t1FromWinner: sql`EXCLUDED.t1_from_winner`,
                t1FromLoser: sql`EXCLUDED.t1_from_loser`,
                t2FromWinner: sql`EXCLUDED.t2_from_winner`,
                t2FromLoser: sql`EXCLUDED.t2_from_loser`
            }
        })
        .returning();

    return result;
}

export async function selectAllPlayoffMatchups() {
    const result = await db
        .select()
        .from(playoffsTable);

    return result;
}

export async function selectPlayoffMatchupsPerSeason(leagueId: string) {
    const result = await db
        .select()
        .from(playoffsTable)
        .where(
            eq(playoffsTable.leagueId, leagueId)
        )
        .orderBy(
            desc(playoffsTable.bracketType),
            playoffsTable.week,
            sql`${playoffsTable.matchupId} NULLS LAST`
        );

    return result;
}

// using!!!!!!!!!!
export async function selectPlayoffMatchupsWithDetails(
    leagueId: string
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
            'team', ${NFLPlayersTable.team}
        )
    `;

    // Build the team roster subquery as a CTE
    const t1Data = db.$with('t1_data').as(
        db
            .select({
                rosterId: matchupsTable.rosterId,
                leagueId: matchupsTable.leagueId,
                week: matchupsTable.week,
                season: matchupsTable.season,
                team: leagueUsersTable.teamName,
                owner: sleeperUsersTable.displayName,
                points: matchupsTable.points,
                startingRoster: sql<(typeof playerJson)[] | null>`
                    jsonb_agg(${playerJson})
                    FILTER (
                        WHERE ${NFLPlayersTable.playerId} = ANY(${matchupsTable.starters})
                    )
                `.as('t1_starting_roster'),
                benchRoster: sql<(typeof playerJson)[] | null>`
                    jsonb_agg(${playerJson})
                    FILTER (
                        WHERE ${NFLPlayersTable.playerId} = ANY(${matchupsTable.players})
                        AND ${NFLPlayersTable.playerId} <> ALL(${matchupsTable.starters})
                    )
                `.as('t1_bench_roster'),
                reserveRoster: sql<null>`NULL`.as('t1_reserve_roster'),
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
                    eq(leagueUsersTable.leagueId, matchupsTable.leagueId),
                    eq(leagueUsersTable.userId, rostersTable.rosterOwnerId)
                )
            )
            .innerJoin(
                sleeperUsersTable,
                eq(sleeperUsersTable.userId, rostersTable.rosterOwnerId)
            )
            .where(
                eq(matchupsTable.leagueId, leagueId)
            )
            .groupBy(
                matchupsTable.rosterId,
                matchupsTable.leagueId,
                matchupsTable.week,
                matchupsTable.season,
                leagueUsersTable.teamName,
                sleeperUsersTable.displayName,
                matchupsTable.points
            )
    );

    const t2Data = db.$with('t2_data').as(
        db
            .select({
                rosterId: matchupsTable.rosterId,
                leagueId: matchupsTable.leagueId,
                week: matchupsTable.week,
                season: matchupsTable.season,
                team: leagueUsersTable.teamName,
                owner: sleeperUsersTable.displayName,
                points: matchupsTable.points,
                startingRoster: sql<(typeof playerJson)[] | null>`
                    jsonb_agg(${playerJson})
                    FILTER (
                        WHERE ${NFLPlayersTable.playerId} = ANY(${matchupsTable.starters})
                    )
                `.as('t2_starting_roster'),
                benchRoster: sql<(typeof playerJson)[] | null>`
                    jsonb_agg(${playerJson})
                    FILTER (
                        WHERE ${NFLPlayersTable.playerId} = ANY(${matchupsTable.players})
                        AND ${NFLPlayersTable.playerId} <> ALL(${matchupsTable.starters})
                    )
                `.as('t2_bench_roster'),
                reserveRoster: sql<null>`NULL`.as('t2_reserve_roster'),
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
                    eq(leagueUsersTable.leagueId, matchupsTable.leagueId),
                    eq(leagueUsersTable.userId, rostersTable.rosterOwnerId)
                )
            )
            .innerJoin(
                sleeperUsersTable,
                eq(sleeperUsersTable.userId, rostersTable.rosterOwnerId)
            )
            .where(
                eq(matchupsTable.leagueId, leagueId)
            )
            .groupBy(
                matchupsTable.rosterId,
                matchupsTable.leagueId,
                matchupsTable.week,
                matchupsTable.season,
                leagueUsersTable.teamName,
                sleeperUsersTable.displayName,
                matchupsTable.points
            )
    );

    const result = await db
        .with(t1Data, t2Data)
        .select({
            // Playoff bracket info
            bracketType: playoffsTable.bracketType,
            bracketMatchupId: playoffsTable.bracketMatchupId,
            week: playoffsTable.week,
            round: playoffsTable.round,
            matchupId: playoffsTable.matchupId,
            winnerId: playoffsTable.winnerId,
            loserId: playoffsTable.loserId,
            place: playoffsTable.place,

            // Navigation info
            t1FromWinner: playoffsTable.t1FromWinner,
            t1FromLoser: playoffsTable.t1FromLoser,
            t2FromWinner: playoffsTable.t2FromWinner,
            t2FromLoser: playoffsTable.t2FromLoser,

            // Team 1 data
            t1RosterId: playoffsTable.t1,
            t1Team: t1Data.team,
            t1Owner: t1Data.owner,
            t1Points: t1Data.points,
            t1Season: t1Data.season,
            t1StartingRoster: t1Data.startingRoster,
            t1BenchRoster: t1Data.benchRoster,

            // Team 2 data
            t2RosterId: playoffsTable.t2,
            t2Team: t2Data.team,
            t2Owner: t2Data.owner,
            t2Points: t2Data.points,
            t2Season: t2Data.season,
            t2StartingRoster: t2Data.startingRoster,
            t2BenchRoster: t2Data.benchRoster,
        })
        .from(playoffsTable)

        // Left join for team 1 roster data
        .leftJoin(
            t1Data,
            and(
                eq(playoffsTable.leagueId, t1Data.leagueId),
                eq(playoffsTable.week, t1Data.week),
                eq(playoffsTable.t1, t1Data.rosterId)
            )
        )

        // Left join for team 2 roster data
        .leftJoin(
            t2Data,
            and(
                eq(playoffsTable.leagueId, t2Data.leagueId),
                eq(playoffsTable.week, t2Data.week),
                eq(playoffsTable.t2, t2Data.rosterId)
            )
        )

        .where(
            eq(playoffsTable.leagueId, leagueId)
        )

        .orderBy(
            playoffsTable.bracketType,
            playoffsTable.round,
            playoffsTable.bracketMatchupId
        );

    return result;
}

export async function selectLeagueWinner(leagueId: string) {
    const [result] = await db
        .select({
            teamName: leagueUsersTable.teamName,
            avatar: leagueUsersTable.avatarId,
        })
        .from(playoffsTable)
        .innerJoin(rostersTable,
            and(
                eq(playoffsTable.leagueId, rostersTable.leagueId),
                eq(playoffsTable.winnerId, rostersTable.rosterId)
            )
        )
        .innerJoin(leagueUsersTable,
            and(
                eq(playoffsTable.leagueId, leagueUsersTable.leagueId),
                eq(leagueUsersTable.userId, rostersTable.rosterOwnerId)
            )
        )
        .where(
            and(
                eq(playoffsTable.leagueId, leagueId),
                eq(playoffsTable.week, 17),
                eq(playoffsTable.bracketType, 'winners_bracket'),
                eq(playoffsTable.place, 1)
            )
        );

    return result;
}

export async function selectLeagueLoser(leagueId: string) {
    const [result] = await db
        .select({
            teamName: leagueUsersTable.teamName,
            avatar: leagueUsersTable.avatarId,
        })
        .from(playoffsTable)
        .innerJoin(rostersTable,
            and(
                eq(playoffsTable.leagueId, rostersTable.leagueId),
                eq(playoffsTable.loserId, rostersTable.rosterId)
            )
        )
        .innerJoin(leagueUsersTable,
            and(
                eq(playoffsTable.leagueId, leagueUsersTable.leagueId),
                eq(leagueUsersTable.userId, rostersTable.rosterOwnerId)
            )
        )
        .where(
            and(
                eq(playoffsTable.leagueId, leagueId),
                eq(playoffsTable.week, 16),
                eq(playoffsTable.bracketType, 'losers_bracket'),
                eq(playoffsTable.place, 5)
            )
        );

    return result;
}