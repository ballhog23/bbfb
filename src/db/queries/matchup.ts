import { sql, and, eq, desc } from "drizzle-orm";
import { db } from "../index.js";
import {
    leagueUsersTable, matchupsTable,
    rostersTable, NFLPlayersTable,
    type StrictInsertMatchup
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
                leagueId: sql`EXCLUDED.league_id`,
                season: sql`EXCLUDED.season`,
                week: sql`EXCLUDED.week`,
                points: sql`EXCLUDED.points`,
                players: sql`EXCLUDED.players`,
                rosterId: sql`EXCLUDED.roster_id`,
                matchupId: sql`EXCLUDED.matchup_id`,
                starters: sql`EXCLUDED.starters`,
                startersPoints: sql`EXCLUDED.starters_points`,
                playersPoints: sql`EXCLUDED.players_points`,
            }
        })
        .returning();

    return result;
}

export async function selectAllMatchups() {
    const result = await db
        .select()
        .from(matchupsTable);

    return result;
}

export async function selectLeagueMatchups(leagueId: string) {
    const result = await db
        .select()
        .from(matchupsTable)
        .where(eq(matchupsTable.leagueId, leagueId));

    return result;
}

export async function selectLeagueMatchupsByWeek(leagueId: string, week: number) {
    const result = await db
        .select()
        .from(matchupsTable)
        .where(
            and(
                eq(matchupsTable.leagueId, leagueId),
                eq(matchupsTable.week, week)
            )
        );

    return result;
}

export async function selectSpecificLeagueMatchup(leagueId: string, week: number, matchupId: number,) {
    const result = await db
        .select({
            season: matchupsTable.season,
            week: matchupsTable.week,
            team: leagueUsersTable.teamName,
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
                                    'stater', TRUE
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
            eq(rostersTable.ownerId, leagueUsersTable.userId)
        ))
        .leftJoinLateral(
            sql`jsonb_each_text(${matchupsTable.playersPoints}) as player_scoring(player_id, points)`,
            sql`TRUE`
        )
        .innerJoin(NFLPlayersTable, eq(NFLPlayersTable.playerId, sql`player_scoring.player_id`))
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
            leagueUsersTable.teamName,
            matchupsTable.points,
            matchupsTable.playersPoints,
        );

    return result;
}