import { sql, eq, and, count, countDistinct, desc } from "drizzle-orm";
import { db } from "../index.js";
import {
    leagueUsersTable, sleeperUsersTable,
    playoffsTable, rostersTable, matchupsTable
} from "../schema.js";

export async function selectChampionInfo(leagueId: string) {
    const [result] = await db
        .select({
            team: leagueUsersTable.teamName,
            name: sleeperUsersTable.displayName,
            avatar: leagueUsersTable.avatarId,
            ownerImage: sleeperUsersTable.avatarId,
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

export async function selectDistinctChamps() {
    const [result] = await db
        .select({
            count: countDistinct(sleeperUsersTable.userId)
        })
        .from(playoffsTable)
        .innerJoin(rostersTable,
            and(
                eq(playoffsTable.leagueId, rostersTable.leagueId),
                eq(playoffsTable.winnerId, rostersTable.rosterId)
            )
        )
        .innerJoin(sleeperUsersTable,
            eq(rostersTable.rosterOwnerId, sleeperUsersTable.userId)
        )
        .where(
            and(
                eq(playoffsTable.week, 17),
                eq(playoffsTable.bracketType, 'winners_bracket'),
                eq(playoffsTable.place, 1),
            )
        );

    return result;
}

export async function selectWinningestChamp() {
    const [result] = await db
        .select({
            team: leagueUsersTable.teamName,
            displayName: sleeperUsersTable.displayName,
            avatar: sleeperUsersTable.avatarId,
            championships: count(sleeperUsersTable.userId),
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
                eq(rostersTable.leagueId, leagueUsersTable.leagueId),
                eq(rostersTable.rosterOwnerId, leagueUsersTable.userId)
            )
        )
        .innerJoin(sleeperUsersTable,
            eq(rostersTable.rosterOwnerId, sleeperUsersTable.userId)
        )
        .where(
            and(
                eq(playoffsTable.week, 17),
                eq(playoffsTable.bracketType, 'winners_bracket'),
                eq(playoffsTable.place, 1),
            )
        )
        .groupBy(sleeperUsersTable.userId, sleeperUsersTable.displayName, sleeperUsersTable.avatarId, leagueUsersTable.teamName)
        .orderBy(desc(count(sleeperUsersTable.userId)))
        .limit(1);

    return result;
}

export type WinningestChamp = Awaited<ReturnType<typeof selectWinningestChamp>>;

export async function selectHighestScoringChampionshipGame() {
    const [result] = await db
        .select({
            team: leagueUsersTable.teamName,
            displayName: sleeperUsersTable.displayName,
            points: matchupsTable.points,
        })
        .from(playoffsTable)
        .innerJoin(matchupsTable,
            and(
                eq(playoffsTable.leagueId, matchupsTable.leagueId),
                eq(playoffsTable.winnerId, matchupsTable.rosterId),
                eq(playoffsTable.matchupId, matchupsTable.matchupId),
                eq(playoffsTable.week, matchupsTable.week)
            )
        )
        .innerJoin(rostersTable,
            and(
                eq(playoffsTable.leagueId, rostersTable.leagueId),
                eq(playoffsTable.winnerId, rostersTable.rosterId)
            )
        )
        .innerJoin(leagueUsersTable,
            and(
                eq(rostersTable.leagueId, leagueUsersTable.leagueId),
                eq(rostersTable.rosterOwnerId, leagueUsersTable.userId)
            )
        )
        .innerJoin(sleeperUsersTable,
            eq(rostersTable.rosterOwnerId, sleeperUsersTable.userId)
        )
        .where(
            and(
                eq(playoffsTable.week, 17),
                eq(playoffsTable.bracketType, 'winners_bracket'),
                eq(playoffsTable.place, 1),
            )
        )
        .orderBy(desc(matchupsTable.points))
        .limit(1);

    return result;
}

export type HighestScoringChampionshipGame = Awaited<ReturnType<typeof selectHighestScoringChampionshipGame>>;