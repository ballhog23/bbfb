import { rawLeagueSchema, rawLeagueUserSchema, rawNFLPlayerSchema, rawRosterSchema, rawNFLStateSchema, rawBracketMatchupSchema, rawSleeperUserSchema, rawMatchupSchema, } from "./zod.js";
import { config } from "../config.js";
// stop a Sleeper request that hangs, so a sync does not keep running after its Lambda gives up
export const SLEEPER_FETCH_TIMEOUT_MS = 15_000;
export class Sleeper {
    leagueId = config.league.id;
    baseURL = `https://api.sleeper.app/v1/`;
    constructor() {
        this.leagueId = config.league.id;
        this.baseURL = `https://api.sleeper.app/v1/`;
    }
    async getLeague(leagueId = this.leagueId) {
        const url = `${this.baseURL}league/${leagueId}`;
        const leagueData = await this.fetchJSON(url);
        this.assertObject(leagueData);
        return rawLeagueSchema.parse(leagueData);
    }
    async getLeagueUsers(leagueId = this.leagueId) {
        const url = `${this.baseURL}league/${leagueId}/users`;
        const leagueUsers = await this.fetchJSON(url);
        this.assertArray(leagueUsers);
        return leagueUsers.map((user) => rawLeagueUserSchema.parse(user));
    }
    async getAllNFLPlayers() {
        const url = `${this.baseURL}/players/nfl`;
        const allPlayers = await this.fetchJSON(url);
        this.assertObject(allPlayers);
        const allPlayersArray = Object.values(allPlayers);
        return allPlayersArray.map((player) => rawNFLPlayerSchema.parse(player));
    }
    async getSleeperUser(userId) {
        const url = `${this.baseURL}user/${userId}`;
        const user = await this.fetchJSON(url); // unknown what we recieved from 3rd party
        this.assertObject(user); // runtime check to be at least the data structure we expect
        return rawSleeperUserSchema.parse(user); // runtime validation to ensure we have all data for normalization
    }
    async getLeagueRosters(leagueId = this.leagueId) {
        const url = `${this.baseURL}league/${leagueId}/rosters`;
        const rosters = await this.fetchJSON(url);
        this.assertArray(rosters);
        return rosters.map((roster) => rawRosterSchema.parse(roster));
    }
    async getWeeklyLeagueMatchups(week, leagueId) {
        if (!leagueId)
            leagueId = this.leagueId;
        const url = `${this.baseURL}league/${leagueId}/matchups/${week}`;
        const leagueMatchups = await this.fetchJSON(url);
        this.assertArray(leagueMatchups);
        return leagueMatchups.map((matchup) => rawMatchupSchema.parse(matchup));
    }
    async getLeaguePlayoffBracket(bracket, leagueId) {
        if (!leagueId)
            leagueId = this.leagueId;
        const url = `${this.baseURL}league/${leagueId}/${bracket}`;
        const playoffBracket = await this.fetchJSON(url);
        this.assertArray(playoffBracket);
        return playoffBracket.map((bracket) => rawBracketMatchupSchema.parse(bracket));
    }
    async getNFLState() {
        const url = `${this.baseURL}state/nfl`;
        const NFLState = await this.fetchJSON(url);
        this.assertObject(NFLState);
        return rawNFLStateSchema.parse(NFLState);
    }
    assertObject(value) {
        if (typeof value !== "object" ||
            value === null ||
            Array.isArray(value)) {
            throw new Error(`Expected Object, received ${typeof value}: ${value}`);
        }
    }
    assertArray(value) {
        if (!Array.isArray(value)) {
            throw new Error(`Expected Array, received ${typeof value}: ${value}`);
        }
    }
    async fetchJSON(url) {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(SLEEPER_FETCH_TIMEOUT_MS),
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} at ${url}`);
        }
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            throw new Error(`Expected JSON, received ${contentType}`);
        }
        return await response.json();
    }
}
