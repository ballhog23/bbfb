// class to interact with sleeper api
import { config } from '../config.js';
import { NotFoundError } from './errors.js';
import {
    leagueUserSchema, leagueSchema,
    type LeagueUser, LeagueUserSchema,
    LeagueSchema, RosterSchema, rosterSchema,
    NFLPlayer, NFLPlayerSchema, RefinedNFLPlayer
} from "./zod.js";


export class Sleeper {
    readonly leagueId = config.league.id;

    constructor() {
        this.leagueId = config.league.id;
    }

    async getLeague(leagueId = this.leagueId): Promise<LeagueSchema> {
        const url = `https://api.sleeper.app/v1/league/${leagueId}`;
        const leagueData = await this.fetchJSON(url);

        if (typeof leagueData !== 'object' || leagueData === null) {
            throw new Error(`Expected Object from ${url}`);
        }

        const looseValidatedLeagueData = leagueSchema.parse(leagueData);
        return this.undefinedToNullDeep(looseValidatedLeagueData);
    }

    async getLeagueRosters(): Promise<RosterSchema[]> {
        const url = `https://api.sleeper.app/v1/league/${this.leagueId}/rosters`;
        const rosterData = await this.fetchJSON(url);

        if (!Array.isArray(rosterData)) {
            throw new Error(`Expected array from ${url}`);
        }

        const looseValidatedRosterData = rosterData.map((roster: RosterSchema) => rosterSchema.parse(roster));
        return this.undefinedToNullDeep(looseValidatedRosterData);
    }

    async getLeagueUsers(): Promise<LeagueUser[]> {
        const url = `https://api.sleeper.app/v1/league/${this.leagueId}/users`;
        const leagueUsers = await this.fetchJSON(url);

        if (!Array.isArray(leagueUsers)) {
            throw new Error(`Expected array from ${url}`);
        }

        const looseLeagueUsers = leagueUsers.map((user: LeagueUserSchema) => leagueUserSchema.parse(user));
        const strictLeagueUsers = this.undefinedToNullDeep(looseLeagueUsers);
        const validatedUserData = strictLeagueUsers.map((user: LeagueUserSchema) => {
            return {
                displayName: user.display_name,
                userId: user.user_id,
                teamName: user.metadata.team_name
            } as LeagueUser;
        });

        return validatedUserData;
    }

    async getAllPlayers(): Promise<RefinedNFLPlayer[]> {
        const url = `https://api.sleeper.app/v1/players/nfl`;
        const allPlayers = await this.fetchJSON(url);

        if (typeof allPlayers !== 'object' || allPlayers === null) {
            throw new Error(`Expected Object from url`);
        }

        const allPlayersArray = Object.values(allPlayers) as NFLPlayer[];
        const looseAllPlayers = allPlayersArray.map((player: NFLPlayer) => NFLPlayerSchema.parse(player));
        const strictAllPlayers = this.undefinedToNullDeep(looseAllPlayers);
        const refinedPlayerData: RefinedNFLPlayer[] = strictAllPlayers.map((player) => {
            return {
                playerId: player.player_id,
                firstName: player.first_name,
                lastName: player.last_name,
                active: player.active,
                fantasyPositions: player.fantasy_positions ?? null,
                position: player.position ?? null,
                team: player.team ?? null
            }
        })

        return refinedPlayerData;
    }

    async getThisWeeksLeagueMatchups(week: number) {
        const url = `https://api.sleeper.app/v1/league/${this.leagueId}/matchups/${week}`;
        const leagueMatchups = await this.fetchJSON(url);
        return leagueMatchups;
    }

    async getLeaguePlayoffBracket(bracket: "winners_bracket" | "losers_bracket") {
        const url = `https://api.sleeper.app/v1/league/${this.leagueId}/${bracket}`;
        const playoffBracket = await this.fetchJSON(url);
        return playoffBracket;
    }

    async getNFLState() {
        const url = `https://api.sleeper.app/v1/state/nfl`;
        const nflState = await this.fetchJSON(url);
        return nflState;
    }

    private undefinedToNullDeep<T>(v: T): T {
        // if value is undefined, return null as T
        if (v === undefined) return null as T;
        // if value has passed loose validation, is null, or is not iterable return value
        if (v === null || typeof v !== 'object') return v;
        // if value is array, recurse to check for deeply nested undefined values
        if (Array.isArray(v)) {
            return v.map((x) => this.undefinedToNullDeep(x)) as T;
        }
        // build new object, check for undefined values, set undefined === null return new object
        const out: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(v as Record<string, unknown>)) {
            out[key] = this.undefinedToNullDeep(val)
        }

        return out as T;
    }

    private async fetchJSON<T>(url: string): Promise<T> {
        const response = await fetch(url);

        if (!response.ok) {
            throw new NotFoundError(
                `HTTP ${response.status} at ${url}`
            );
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            throw new Error(`Expected JSON, received ${contentType}`);
        }

        return await response.json();
    }
}