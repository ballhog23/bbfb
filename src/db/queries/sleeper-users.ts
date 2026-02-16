import {
    leagueUsersTable, matchupOutcomesTable,
    sleeperUsersTable, rostersTable,
    type StrictInsertSleeperUser
} from "../schema.js";
import { db } from '../index.js';
import { sql, eq, and, desc, } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

// handles initial insertion/sync
export async function insertSleeperUser(user: StrictInsertSleeperUser) {
    const [result] = await db
        .insert(sleeperUsersTable)
        .values(user)
        .onConflictDoUpdate({
            target: sleeperUsersTable.userId,
            set: {
                avatarId: sql`EXCLUDED.avatar_id`,
                userName: sql`EXCLUDED.user_name`,
                displayName: sql`EXCLUDED.display_name`,
            }
        })
        .returning();

    return result;
}

// used in rivalry page dropdowns
export async function selectAllSleeperUsersData() {
    const result = await db
        .select({
            teamName: sql<string>`
                (
                    SELECT
                        lu.team_name
                    FROM league_users lu
                    INNER JOIN rosters r ON
                        lu.user_id = r.roster_owner_id AND 
                        lu.league_id = r.league_id
                    WHERE
                        lu.user_id = sleeper_users.user_id
                    ORDER BY r.season DESC
                    LIMIT 1
                )
            `,
            teamAvatar: sql<string | null>`
                (
                    SELECT
                        lu.avatar_id
                    FROM league_users lu
                    INNER JOIN rosters r ON
                        lu.user_id = r.roster_owner_id AND 
                        lu.league_id = r.league_id
                    WHERE
                        lu.user_id = sleeper_users.user_id
                    ORDER BY r.season DESC
                    LIMIT 1
                )
            `,
            userId: sleeperUsersTable.userId,
            displayName: sleeperUsersTable.displayName,
            userAvatar: sleeperUsersTable.avatarId
        })
        .from(sleeperUsersTable);


    return result;
}

export type SleeperUserData = Awaited<ReturnType<typeof selectAllSleeperUsersData>>;


export async function selectAllSleeperUsers() {
    const result = await db
        .select()
        .from(sleeperUsersTable);

    return result;
}

export async function selectSleeperUser(userId: string) {
    const [result] = await db
        .select()
        .from(sleeperUsersTable)
        .where(eq(sleeperUsersTable.userId, userId));

    return result;
}

// used in rivalry page stats
export async function getHeadToHeadMatchupData(challenger: string, opponent: string) {
    const challengerData = db.$with('challenger_data').as(
        db
            .select()
            .from(matchupOutcomesTable)
            .where(
                eq(
                    matchupOutcomesTable.rosterOwnerId, challenger
                )
            )
    );
    const opponentData = db.$with('opponent_data').as(
        db
            .select()
            .from(matchupOutcomesTable)
            .where(
                eq(
                    matchupOutcomesTable.rosterOwnerId, opponent
                )
            )
    );
    const leagueUsersChallenger = alias(leagueUsersTable, 'lu_challenger');
    const leagueUsersOpponent = alias(leagueUsersTable, 'lu_opponent');
    const sleeperUsersChallenger = alias(sleeperUsersTable, 'su_challenger');
    const sleeperUsersOpponent = alias(sleeperUsersTable, 'su_opponent');

    const result = await db
        .with(challengerData, opponentData)
        .select({
            week: challengerData.week,
            season: challengerData.season,
            matchupId: challengerData.matchupId,
            challengerRosterOwnerId: challengerData.rosterOwnerId,
            challengerTeamName: leagueUsersChallenger.teamName,
            challengerUserAvatar: sleeperUsersChallenger.avatarId,
            challengerTeamAvatar: leagueUsersChallenger.avatarId,
            challengerPoints: challengerData.pointsFor,
            challengerOutcome: challengerData.outcome,
            opponentRosterOwnerId: opponentData.rosterOwnerId,
            opponentTeamName: leagueUsersOpponent.teamName,
            opponentUserAvatar: sleeperUsersOpponent.avatarId,
            opponentTeamAvatar: leagueUsersOpponent.avatarId,
            opponentPoints: opponentData.pointsFor,
        })
        .from(challengerData)
        .innerJoin(opponentData,
            and(
                eq(challengerData.leagueId, opponentData.leagueId),
                eq(challengerData.matchupId, opponentData.matchupId),
                eq(challengerData.season, opponentData.season),
                eq(challengerData.week, opponentData.week),
            )

        )
        .innerJoin(leagueUsersChallenger,
            and(
                eq(challengerData.leagueId, leagueUsersChallenger.leagueId),
                eq(challengerData.rosterOwnerId, leagueUsersChallenger.userId)
            )
        )
        .innerJoin(leagueUsersOpponent,
            and(
                eq(opponentData.leagueId, leagueUsersOpponent.leagueId),
                eq(opponentData.rosterOwnerId, leagueUsersOpponent.userId)
            )
        )
        .innerJoin(sleeperUsersChallenger,
            eq(challengerData.rosterOwnerId, sleeperUsersChallenger.userId)
        )
        .innerJoin(sleeperUsersOpponent,
            eq(opponentData.rosterOwnerId, sleeperUsersOpponent.userId)
        )
        .orderBy(
            desc(challengerData.season),
            desc(challengerData.week),
        );

    return result;
}

export type HeadToHeadData = Awaited<ReturnType<typeof getHeadToHeadMatchupData>>;