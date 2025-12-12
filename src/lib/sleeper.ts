// class to interact with sleeper api
import {
    rawLeagueSchema, rawLeagueUserSchema,
    rawNFLPlayerSchema, rosterSchema,
    NFLStateSchema, bracketSchema,
    matchupSchema,
    type RawLeague, RawLeagueUser,
    RawNFLPlayer
} from "./zod.js";
import { config } from '../config.js';
import { NotFoundError } from './errors.js';


export class Sleeper {
    readonly leagueId = config.league.id;
    readonly baseURL = `https://api.sleeper.app/v1/`;

    constructor() {
        this.leagueId = config.league.id;
        this.baseURL = `https://api.sleeper.app/v1/`;
    }

    async getLeague(leagueId = this.leagueId): Promise<RawLeague> {
        const url = `${this.baseURL}league/${leagueId}`;

        try {
            const leagueData = await this.fetchJSON(url);
            this.assertObject(leagueData);
            return rawLeagueSchema.parse(leagueData);

        } catch (error) {
            if (error instanceof Error) {
                const wrapper = new NotFoundError(`Could not fetch league ${leagueId}`);
                wrapper.stack = error.stack;
                throw wrapper;
            }

            throw error;
        }
    }

    async getLeagueUsers(leagueId: string = this.leagueId): Promise<RawLeagueUser[]> {
        const url = `${this.baseURL}league/${leagueId}/users`;

        try {
            const leagueUsers = await this.fetchJSON(url);
            this.assertArray(leagueUsers);
            return leagueUsers.map(user => rawLeagueUserSchema.parse(user));

        } catch (error) {
            if (error instanceof Error) {
                const wrapper = new NotFoundError(`Could not fetch league ${leagueId}`);
                wrapper.stack = error.stack;
                throw wrapper;
            }

            throw error;
        }
    }

    async getAllNFLPlayers(): Promise<RawNFLPlayer[]> {
        const url = `${this.baseURL}/players/nfl`;

        try {
            const allPlayers = await this.fetchJSON(url);
            this.assertObject(allPlayers);
            const allPlayersArray = Object.values(allPlayers);
            return allPlayersArray.map(player => rawNFLPlayerSchema.parse(player));

        } catch (error) {
            if (error instanceof Error) {
                const wrapper = new NotFoundError(`Could not fetch NFL Players from ${url}}`);
                wrapper.stack = error.stack;
                throw wrapper;
            }

            throw error;
        }
    }

    // private async getLeagueRosters(leagueId = this.leagueId): Promise<RawSleeperRoster[]> {
    //     const url = `${this.baseURL}league/${leagueId}/rosters`;
    //     const rosterData = await this.fetchJSON(url);

    //     this.assertArray(rosterData);

    //     const looseRosterData = rosterData.map((roster) => rosterSchema.parse(roster));
    //     const strictRosterData = this.undefinedToNullDeep(looseRosterData);
    //     const refinedRosterData = strictRosterData.map(roster => {
    //         return {
    //             rosterId: roster.roster_id,
    //             ownerId: roster.owner_id,
    //             leagueId: roster.league_id,
    //             starters: roster.starters,
    //             wins: roster.settings.wins,
    //             ties: roster.settings.ties,
    //             losses: roster.settings.losses,
    //             fptsAgainst: roster.settings.fpts_against,
    //             fpts: roster.settings.fpts,
    //             players: roster.players,
    //             reserve: roster.reserve ?? null,
    //             streak: roster.metadata?.streak ?? null,
    //             record: roster.metadata?.record ?? null,
    //         } satisfies RawSleeperRoster;
    //     });

    //     return refinedRosterData;
    // }

    // public async getAllRosters(leagues: SelectLeague[]): Promise<InsertRoster[]> {
    //     const allLeagueRosters: InsertRoster[] = [];

    //     for (const league of leagues) {
    //         const leagueRosters = await this.getLeagueRosters(league.leagueId);
    //         allLeagueRosters.push(
    //             ...leagueRosters.map(roster => {
    //                 return {
    //                     ...roster,
    //                     season: league.season
    //                 } satisfies InsertRoster;
    //             })
    //         );

    //     }

    //     return allLeagueRosters;
    // }

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
            throw new Error(`Expected Object, received ${typeof value}`);
        }
    }

    private assertArray<T = unknown>(value: unknown): asserts value is Array<T> {
        if (!Array.isArray(value)) {
            throw new Error(`Expected Array, received ${typeof value}`);
        }
    }

    private async fetchJSON<T>(url: string): Promise<T> {
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