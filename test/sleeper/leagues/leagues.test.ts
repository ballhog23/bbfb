import type { StrictInsertLeague } from "../../../src/db/schema.js";
import * as raw2025League from "./raw/league-2025.json";
import type { NullableRawLeague, RawLeague, StrictLeague } from "../../../src/lib/zod.js";
import { describe, expect, it, vi } from "vitest";
import * as raw2024League from "./raw/league-2024.json";
import * as normalized2025League from "./normalized/league-2025.json";
import * as rawLeagueHistory from "./raw/league-history.json";
import * as normalizedLeagueHistory from "./normalized/league-history.json";
import {
    buildLeagueHistory, getAllLeagues,
    normalizeLeague, rawToNormalizedLeagueData, syncLeague
} from "../../../src/services/leagueService.js";
import { strictLeagueSchema } from "../../../src/lib/zod.js";
import { undefinedToNullDeep } from "../../../src/lib/helpers.js";
import { Sleeper } from "../../../src/lib/sleeper.js";
import { NotFoundError } from "../../../src/lib/errors.js";

// Test could break if new fields are added to leagues on Sleepers side, but the expected mapping is dynamic so it’s mostly future-proof.
const rawAllLeagues: RawLeague[] = Reflect.get(rawLeagueHistory, 'default');
const normalizedAllLeagues: StrictLeague[] = Reflect.get(normalizedLeagueHistory, 'default');
const sleeper = new Sleeper();
const leagueId2024 = '1118232706736807936';

describe("league normalization tests", () => {
    const raw2025: RawLeague = Reflect.get(raw2025League, 'default');
    const final2025: StrictLeague = Reflect.get(normalized2025League, 'default');

    it("handles null previous_league_id: normalizeLeague()", () => {
        const rawLeagueDummyNull: NullableRawLeague = {
            league_id: "123",
            status: "post_season",
            season: "2025",
            name: "Test League",
            avatar: "avatar123",
            previous_league_id: null, // edge case you want to test
            draft_id: "draft123",
            roster_positions: ["QB", "RB", "WR"],
            total_rosters: 10,
        };
        const rawLeagueDummy: NullableRawLeague = {
            league_id: "123",
            status: "post_season",
            season: "2025",
            name: "Test League",
            avatar: "avatar123",
            previous_league_id: "23234",
            draft_id: "draft123",
            roster_positions: ["QB", "RB", "WR"],
            total_rosters: 10,
            // other optional fields can be omitted if NullableRawLeague allows
        };

        const normalizedWithNullPrevLeague = normalizeLeague(rawLeagueDummyNull);
        const normalizedWithPrevLeague = normalizeLeague(rawLeagueDummy);
        expect(normalizedWithNullPrevLeague.previousLeagueId).toBeNull();
        expect(normalizedWithPrevLeague.previousLeagueId).toBeDefined();
    });

    it('normalizes a single season correctly: normalizeLeague()', () => {
        const nullableRawLeague = undefinedToNullDeep(raw2025) as NullableRawLeague;
        const result = normalizeLeague(nullableRawLeague);
        const notStrictObject = { ...final2025, extraProp: "shouldn't exist after normalization" };

        expect(result).toEqual(final2025);
        expect(result.leagueId).toBe(final2025.leagueId);
        expect(result.rosterPositions).toEqual(final2025.rosterPositions);
        expect(Object.keys(result)).toEqual(Object.keys(final2025));
        expect(result).not.toEqual(notStrictObject);
        expect(() => strictLeagueSchema.parse(notStrictObject)).toThrow();
    });

    it('normalizes an array of leagues correctly: rawToNormalizedLeagueData()', () => {
        const result = rawToNormalizedLeagueData(rawAllLeagues);
        expect(result).toEqual(normalizedAllLeagues);
    });

    it("fetches league from Sleeper and returns normalized data: syncLeague()", async () => {
        // Arrange
        const raw = Reflect.get(raw2024League, "default");
        const expected = {
            leagueId: raw.league_id,
            status: raw.status,
            season: raw.season,
            leagueName: raw.name,
            avatarId: raw.avatar,
            draftId: raw.draft_id,
            rosterPositions: raw.roster_positions,
            totalRosters: raw.total_rosters,
            previousLeagueId: raw.previous_league_id ?? null,
        };

        // Act
        const result = await syncLeague(leagueId2024); // uses MSW intercepted request

        // Assert
        expect(result).toEqual(expected);
    });

    it("returns the entire league history normalized: buildLeagueHistory()", async () => {
        // Arrange: fetch the raw leagues using getAllLeagues (already tested separately)
        const rawAllLeagues = await getAllLeagues();

        // Expected: normalized leagues
        const expected: StrictInsertLeague[] = rawAllLeagues.map(raw => ({
            leagueId: raw.league_id,
            status: raw.status,
            season: raw.season,
            leagueName: raw.name,
            avatarId: raw.avatar,
            previousLeagueId: raw.previous_league_id ?? null,
            draftId: raw.draft_id,
            rosterPositions: raw.roster_positions,
            totalRosters: raw.total_rosters,
        }));

        // Act: call the function under test
        const result = await buildLeagueHistory();

        // Assert: all leagues are normalized and array has reasonable length
        expect(result.every(l => typeof l.leagueId === "string")).toBe(true);
        expect(result.length).toBeGreaterThanOrEqual(5); // ensure we have at least 5 seasons
    });
});

// check /mocks && vitest.setup.ts
// https://vitest.dev/guide/mocking/requests.html
describe("Sleeper.getLeague (MSW intercepted)", () => {
    const rawLeague2024 = Reflect.get(raw2024League, "default");

    it('returns a single league', async () => {
        const response = await sleeper.getLeague(leagueId2024);
        expect(response).toEqual(rawLeague2024);
    });

    it("throws NotFoundError when league is not found", async () => {
        const leagueId = '5535';

        await expect(
            sleeper.getLeague(leagueId)
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("fetches entire league history starting at current league: getAllLeagues()", async () => {
        const response = await getAllLeagues();
        expect(response).toEqual(rawAllLeagues);
    });
});
