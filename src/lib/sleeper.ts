// class to interact with sleeper api
import type { User } from "../api/types.js";
import { config } from '../config.js';
import { NotFoundError } from './errors.js';
import { LeagueUserSchema, type LeagueUser, LeagueUserData } from "./zod.js";

export class Sleeper {
    readonly leagueId: string = config.league.id;

    constructor() {
        this.leagueId = config.league.id;
    }

    async getLeague() {
        const url = `https://api.sleeper.app/v1/league/${this.leagueId}`;
        const league = await fetch(url);

        if (!league)
            throw new NotFoundError(
                "The league was not found. Please make sure your League ID is correct."
            );

        return await league.json();
    }

    async getLeagueRosters() {
        const url = `https://api.sleeper.app/v1/league/${this.leagueId}/rosters`;
        const leagueRosters = await fetch(url);

        if (!leagueRosters)
            throw new NotFoundError(
                `No rosters were found for League ID: ${this.leagueId}. Please make sure your League ID is correct.`
            );

        return await leagueRosters.json();
    }

    async getLeagueUsers(): Promise<LeagueUserData[]> {
        const url = `https://api.sleeper.app/v1/league/${this.leagueId}/users`;
        const response = await fetch(url);

        if (!response)
            throw new NotFoundError(
                `No users were found for League ID: ${this.leagueId}. Please make sure your League ID is correct.`
            );

        const leagueUsers = await response.json();

        if (!Array.isArray(leagueUsers)) {
            throw new Error(`Expected array from ${url}`);
        }

        const validatedLeagueUsers = leagueUsers.map((user: LeagueUser) => LeagueUserSchema.parse(user));
        const userData = validatedLeagueUsers.map((user: LeagueUser) => {
            const extractedUserData: LeagueUserData = {
                displayName: user.display_name,
                userId: user.user_id,
                teamName: user.metadata.team_name || null
            }

            return extractedUserData;
        });

        return userData;
    }

    async getLeagueUser(userId: string): Promise<LeagueUser> {
        const url = `https://api.sleeper.app/v1/user/${userId}`;
        const user = await fetch(url);

        if (!user.ok) {
            throw new NotFoundError(`Something went wrong with the request. Check UserId: ${userId}`)
        }

        return await user.json();
    }

    async getThisWeeksLeagueMatchups(week: number) {
        const url = `https://api.sleeper.app/v1/league/${this.leagueId}/matchups/${week}`;
        const leagueMatchups = await fetch(url);

        if (!leagueMatchups)
            throw new NotFoundError(
                `No league matchups were found for League ID: ${this.leagueId}. Please make sure your League ID is correct.`
            );

        return await leagueMatchups.json();
    }

    async getLeagueTransactions(week: number) {
        const url = `https://api.sleeper.app/v1/league/${this.leagueId}/transactions/${week}`;
        const leagueTransactions = await fetch(url);
        if (!leagueTransactions)
            throw new NotFoundError(
                `No transactions found. Either a single transaction wasn't made or perhaps your League ID: ${this.leagueId} is incorrect.`
            );

        return await leagueTransactions.json();
    }

    // endpoint is currently only returning losers_bracket
    async getLeaguePlayoffBracket(bracket: "winners_bracket" | "losers_bracket") {
        const url = `https://api.sleeper.app/v1/league/${this.leagueId}/${bracket}`;
        const playoffBracket = await fetch(url);

        if (!playoffBracket)
            throw new NotFoundError(
                `No playoff brackets were found for League ID: ${this.leagueId}. Please make sure your League ID is correct.`
            );

        return await playoffBracket.json();
    }

    async getNFLState() {
        const url = `https://api.sleeper.app/v1/state/nfl`;
        const nflState = await fetch(url);

        if (!nflState)
            throw new NotFoundError(
                `The current state of the NFL according to sleeper was not found.`
            );

        return await nflState.json();
    }
}