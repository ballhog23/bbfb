import { sql, eq, and } from "drizzle-orm";
import { db } from "../index.js";
import {
    leagueUsersTable, sleeperUsersTable,
    playoffsTable, rostersTable
} from "../schema.js";

export async function selectChampionInfo(leagueId: string) {
    const [result] = await db
        .select({
            team: leagueUsersTable.teamName,
            name: sleeperUsersTable.displayName,
            avatar: sql<string>`
                COALESCE(
                ${leagueUsersTable.avatarId}, 
                    (
                        SELECT avatar_id
                        FROM sleeper_users su
                        WHERE ${leagueUsersTable.userId} = su.user_id
                    )
                )
            `,
            season: rostersTable.season,
            wins: rostersTable.wins,
            losses: rostersTable.losses,
            totalPts: rostersTable.fpts,
            mvp: sql<string>`
            (
                SELECT
                    np.first_name || ' ' || np.last_name as player_name
                FROM
                    matchups m,
                    jsonb_each_text(m.players_points) AS player(key, value),
                    nfl_players np
                WHERE
                    m.league_id = ${playoffsTable.leagueId} AND
                    m.roster_id = ${playoffsTable.winnerId} AND
                    np.player_id = player.key
                GROUP BY player_name
                ORDER BY SUM(player.value::numeric) DESC
                LIMIT 1
            )`,
            finalsScore: sql<string>`
            (
                SELECT m.points
                FROM matchups m
                WHERE
                    m.league_id = ${playoffsTable.leagueId} AND
                    m.roster_id = ${playoffsTable.winnerId} AND
                    m.matchup_id = ${playoffsTable.matchupId} AND
                    m.week = ${playoffsTable.week}
            )`,
            defeated: sql<string>`
            (
                SELECT
                    COALESCE(lu.team_name, su.display_name)
                FROM rosters r
                INNER JOIN league_users lu ON
                    lu.league_id = r.league_id AND
                    lu.user_id = r.roster_owner_id
                INNER JOIN sleeper_users su ON
                    su.user_id = lu.user_id
                WHERE
                    r.league_id = ${playoffsTable.leagueId} AND
                    r.roster_id = ${playoffsTable.loserId}
            )`
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
        .innerJoin(sleeperUsersTable,
            eq(
                leagueUsersTable.userId, sleeperUsersTable.userId
            )
        )
        .where(
            and(
                eq(playoffsTable.leagueId, leagueId),
                eq(playoffsTable.week, 17),
                eq(playoffsTable.bracketType, 'winners_bracket'),
                eq(playoffsTable.place, 1),
            )
        );

    return result;
}

export type ChampionInfo = Awaited<ReturnType<typeof selectChampionInfo>>; 