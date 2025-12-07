// class to interact with sleeper api
import {
    type InsertLeagueUser,
    RefinedMatchup,
    InsertNFLPlayer,
    InsertLeague,
    InsertRoster,
    SelectLeague
} from "../db/schema.js";
import {
    leagueUserSchema, leagueSchema,
    matchupSchema, NFLStateSchema,
    bracketSchema, NFLPlayerSchema,
    rosterSchema,
    type NFLState,
    Bracket,
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

    async getLeague(leagueId = this.leagueId): Promise<InsertLeague> {
        const url = `${this.baseURL}/league/${leagueId}`;
        const leagueData = await this.fetchJSON(url);

        this.assertObject(leagueData);

        const looseValidatedLeagueData = leagueSchema.parse(leagueData);
        const strictLeagueData = this.undefinedToNullDeep(looseValidatedLeagueData);
        return {
            leagueId: strictLeagueData.league_id,
            status: strictLeagueData.status === 'in_season' ? true : false,
            season: strictLeagueData.season,
            leagueName: strictLeagueData.name,
            avatarId: strictLeagueData.avatar,
            previousLeagueId: strictLeagueData.previous_league_id || null,
            rosterPositions: strictLeagueData.roster_positions,
            totalRosters: strictLeagueData.total_rosters,
        } satisfies InsertLeague;
    }

    public async getPreviousLeagues(league: InsertLeague): Promise<InsertLeague[] | null> {
        if (!league.previousLeagueId) return null;

        const prevLeagues: InsertLeague[] = [];
        let current: string | null = league.previousLeagueId;

        while (current !== null) {
            const prevLeague = await this.getLeague(current);
            prevLeagues.push(prevLeague);
            current = prevLeague.previousLeagueId || null;
        }

        return prevLeagues;
    }

    async getLeagueUsers(): Promise<InsertLeagueUser[]> {
        const url = `${this.baseURL}league/${this.leagueId}/users`;
        const leagueUsers = await this.fetchJSON(url);

        this.assertArray(leagueUsers);

        const looseLeagueUsers = leagueUsers.map(user => leagueUserSchema.parse(user));
        const strictLeagueUsers = this.undefinedToNullDeep(looseLeagueUsers);
        const validatedUserData = strictLeagueUsers.map(user => {
            return {
                displayName: user.display_name,
                userId: user.user_id,
                teamName: user.metadata.team_name ?? null,
                avatarId: user.avatar,
            } satisfies InsertLeagueUser;
        });

        return validatedUserData;
    }

    async getAllPlayers(): Promise<InsertNFLPlayer[]> {
        const url = `${this.baseURL}/players/nfl`;
        const allPlayers = await this.fetchJSON(url);

        this.assertObject(allPlayers);

        const allPlayersArray = Object.values(allPlayers);
        const looseAllPlayers = allPlayersArray.map(player => NFLPlayerSchema.parse(player));
        const strictAllPlayers = this.undefinedToNullDeep(looseAllPlayers);
        const refinedPlayerData = strictAllPlayers.map(player => {
            return {
                playerId: player.player_id,
                firstName: player.first_name,
                lastName: player.last_name,
                active: player.active,
                fantasyPositions: player.fantasy_positions ?? null,
                position: player.position ?? null,
                team: player.team ?? null
            } satisfies InsertNFLPlayer;
        });

        return refinedPlayerData;
    }

    private async getLeagueRosters(leagueId = this.leagueId): Promise<Array<Omit<InsertRoster, "season">>> {
        const url = `${this.baseURL}league/${leagueId}/rosters`;
        const rosterData = await this.fetchJSON(url);

        this.assertArray(rosterData);

        const looseRosterData = rosterData.map((roster) => rosterSchema.parse(roster));
        const strictRosterData = this.undefinedToNullDeep(looseRosterData);
        const refinedRosterData = strictRosterData.map(roster => {
            return {
                rosterId: roster.roster_id,
                ownerId: roster.owner_id,
                leagueId: roster.league_id,
                starters: roster.starters,
                wins: roster.settings.wins,
                ties: roster.settings.ties,
                losses: roster.settings.losses,
                fptsAgainst: roster.settings.fpts_against,
                fpts: roster.settings.fpts,
                players: roster.players,
                reserve: roster.reserve ?? null,
                streak: roster.metadata?.streak ?? null,
                record: roster.metadata?.record ?? null,
            } satisfies Omit<InsertRoster, "season">;
        });

        return refinedRosterData;
    }

    public async getAllRosters(leagues: SelectLeague[]): Promise<InsertRoster[]> {
        const allLeagueRosters: InsertRoster[] = [];

        for (const league of leagues) {
            const leagueRosters = await this.getLeagueRosters(league.leagueId);
            allLeagueRosters.push(
                ...leagueRosters.map(roster => {
                    return {
                        ...roster,
                        season: league.season
                    } satisfies InsertRoster;
                })
            );

        }

        return allLeagueRosters;
    }

    async getThisWeeksLeagueMatchups(week: number): Promise<RefinedMatchup[]> {
        const url = `${this.baseURL}/league/${this.leagueId}/matchups/${week}`;
        const leagueMatchups = await this.fetchJSON(url);

        this.assertArray(leagueMatchups);

        const looseMatchupData = leagueMatchups.map((matchup) => matchupSchema.parse(matchup));
        const strictMatchupData = this.undefinedToNullDeep(looseMatchupData);
        const normalizedMatchupData = strictMatchupData.map((matchup) => {
            return {
                starters: matchup.starters,
                rosterId: matchup.roster_id,
                players: matchup.players,
                matchupId: matchup.matchup_id,
                points: matchup.points,
                customPoints: matchup.custom_points ?? null,
            } satisfies RefinedMatchup;
        });

        return normalizedMatchupData;
    }

    async getLeaguePlayoffBracket(bracket: "winners_bracket" | "losers_bracket"): Promise<Bracket[]> {
        const url = `${this.baseURL}league/${this.leagueId}/${bracket}`;
        const playoffBracket = await this.fetchJSON(url);

        this.assertArray(playoffBracket);

        const loosePlayoffBracket = playoffBracket.map((bracket) => bracketSchema.parse(bracket));
        return this.undefinedToNullDeep(loosePlayoffBracket);
    }

    async getNFLState(): Promise<NFLState> {
        const url = `${this.baseURL}state/nfl`;
        const NFLState = await this.fetchJSON(url);

        this.assertObject(NFLState);

        const looseNFLState = NFLStateSchema.parse(NFLState);
        return this.undefinedToNullDeep(looseNFLState);
    }

    // data normalization helpers
    public buildUserAvatarURLs(avatarId: string): [
        `https://sleepercdn.com/avatars/thumbs/${string}`,
        `https://sleepercdn.com/avatars/${string}`
    ] {
        const thumbnailURL =
            `https://sleepercdn.com/avatars/thumbs/${avatarId}` as `https://sleepercdn.com/avatars/thumbs/${string}`;
        const fullSizeURL =
            `https://sleepercdn.com/avatars/${avatarId}` as `https://sleepercdn.com/avatars/${string}`;
        return [thumbnailURL, fullSizeURL];
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
            out[key] = this.undefinedToNullDeep(val);
        }

        return out as T;
    }

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