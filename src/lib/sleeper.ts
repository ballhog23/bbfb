import {
    rawLeagueSchema, rawLeagueUserSchema,
    rawNFLPlayerSchema, rawRosterSchema,

    type RawLeague, RawLeagueUser,
    RawNFLPlayer, RawRoster,
    RawSleeperUser,
    rawSleeperUserSchema
} from "./zod.js";
import { config } from '../config.js';


export class Sleeper {
    readonly leagueId = config.league.id;
    readonly baseURL = `https://api.sleeper.app/v1/`;

    constructor() {
        this.leagueId = config.league.id;
        this.baseURL = `https://api.sleeper.app/v1/`;
    }

    async getLeague(leagueId = this.leagueId): Promise<RawLeague> {
        const url = `${this.baseURL}league/${leagueId}`;
        const leagueData = await this.fetchJSON(url);

        this.assertObject(leagueData);

        return rawLeagueSchema.parse(leagueData);
    }

    async getLeagueUsers(leagueId: string = this.leagueId): Promise<RawLeagueUser[]> {
        const url = `${this.baseURL}league/${leagueId}/users`;
        const leagueUsers = await this.fetchJSON(url);

        this.assertArray(leagueUsers);

        return leagueUsers.map(user => rawLeagueUserSchema.parse(user));
    }

    async getAllNFLPlayers(): Promise<RawNFLPlayer[]> {
        const url = `${this.baseURL}/players/nfl`;
        const allPlayers = await this.fetchJSON(url);

        this.assertObject(allPlayers);

        const allPlayersArray = Object.values(allPlayers);
        return allPlayersArray.map(player => rawNFLPlayerSchema.parse(player));
    }

    async getSleeperUser(userId: string): Promise<RawSleeperUser> {
        const url = `${this.baseURL}user/${userId}`;
        const user = await this.fetchJSON(url); // unknown what we recieved from 3rd party
        this.assertObject(user); // runtime check to be at least the data structure we expect
        return rawSleeperUserSchema.parse(user); // runtime validation to ensure we have all data for normalization
    }

    async getLeagueRosters(leagueId = this.leagueId): Promise<RawRoster[]> {
        const url = `${this.baseURL}league/${leagueId}/rosters`;
        const rosters = await this.fetchJSON(url);
        this.assertArray(rosters);
        return rosters.map(roster => rawRosterSchema.parse(roster));
    }

    // async getThisWeeksLeagueMatchups(week: number): Promise<RefinedMatchup[]> {
    //     const url = `${this.baseURL}/league/${this.leagueId}/matchups/${week}`;
    //     const leagueMatchups = await this.fetchJSON(url);

    //     this.assertArray(leagueMatchups);

    //     const looseMatchupData = leagueMatchups.map((matchup) => matchupSchema.parse(matchup));
    //     const strictMatchupData = this.undefinedToNullDeep(looseMatchupData);
    //     const normalizedMatchupData = strictMatchupData.map((matchup) => {
    //         return {
    //             starters: matchup.starters,
    //             rosterId: matchup.roster_id,
    //             players: matchup.players,
    //             matchupId: matchup.matchup_id,
    //             points: matchup.points,
    //             customPoints: matchup.custom_points ?? null,
    //         } satisfies RefinedMatchup;
    //     });

    //     return normalizedMatchupData;
    // }

    // async getLeaguePlayoffBracket(bracket: "winners_bracket" | "losers_bracket"): Promise<Bracket[]> {
    //     const url = `${this.baseURL}league/${this.leagueId}/${bracket}`;
    //     const playoffBracket = await this.fetchJSON(url);

    //     this.assertArray(playoffBracket);

    //     const loosePlayoffBracket = playoffBracket.map((bracket) => bracketSchema.parse(bracket));
    //     return this.undefinedToNullDeep(loosePlayoffBracket);
    // }

    // async getNFLState(): Promise<NFLState> {
    //     const url = `${this.baseURL}state/nfl`;
    //     const NFLState = await this.fetchJSON(url);

    //     this.assertObject(NFLState);

    //     const looseNFLState = NFLStateSchema.parse(NFLState);
    //     return this.undefinedToNullDeep(looseNFLState);
    // };

    // data normalization helpers

    private assertObject<T = Record<string, unknown>>(value: unknown): asserts value is T {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            throw new Error(`Expected Object, received ${typeof value}: ${value}`);
        }
    }

    private assertArray<T = unknown>(value: unknown): asserts value is Array<T> {
        if (!Array.isArray(value)) {
            throw new Error(`Expected Array, received ${typeof value}: ${value}`);
        }
    }

    private async fetchJSON(url: string): Promise<unknown> {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} at ${url}`); // just a raw error
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            throw new Error(`Expected JSON, received ${contentType}`);
        }

        return await response.json();
    }
}