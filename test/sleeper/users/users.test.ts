import {
    strictLeagueUserSchema, type NullableRawLeagueUser,
    type RawLeagueUser, type StrictLeagueUser
} from "../../../src/lib/zod.js";
import { describe, expect, it, vi } from "vitest";
import { Sleeper } from "../../../src/lib/sleeper";
import { NotFoundError } from "../../../src/lib/errors";
import {
    determineActiveUsers, normalizeLeagueUser,
    rawToNormalizedLeagueUser, syncLeagueUsers,
    buildLeagueUsersHistory
} from "../../../src/services/usersService.js";
import { undefinedToNullDeep } from "../../../src/lib/helpers.js";
import { SelectLeagueUser } from "../../../src/db/schema.js";
import { selectAllLeagues } from "../../../src/db/queries/leagues.js";
import * as raw2025LeagueUsers from "./raw/league-users-2025.json";
import * as raw2024LeagueUsers from "./raw/league-users-2024.json";
import * as dbLeagueUsers from "./normalized/db/database-all-league-users.json";
import * as waylenRaw from "./raw/raw-user-726512017078317056.json";
import * as calebRaw from "./raw/raw-user-730912754680061952.json";
import * as waylenNormalized from "./normalized/normalized-user-726512017078317056.json";
import * as calebNormalized from "./normalized/normalized-user-730912754680061952.json";
import * as uniqueNormalizedLeagueUsers from "./normalized/user-history-normalized.json";
import * as uniqueRawLeagueUsers from "./raw/unique-league-user-history.json";
import * as userDb from "../../../src/db/queries/users.js";
import * as leagueDb from "../../../src/db/queries/leagues.js";

const rawAllLeagueUsers: RawLeagueUser[] = Reflect.get(uniqueRawLeagueUsers, "default");
const uniqueAllLeagueUsers: RawLeagueUser[] = Reflect.get(uniqueNormalizedLeagueUsers, "default");
const raw2025users: RawLeagueUser[] = Reflect.get(raw2025LeagueUsers, "default");
const raw2024users: RawLeagueUser[] = Reflect.get(raw2024LeagueUsers, "default");
const allDbUsers: SelectLeagueUser[] = Reflect.get(dbLeagueUsers, "default");

describe('Sleeper.getLeagueUsers (MSW intercepted)', async () => {
    const sleeper = new Sleeper();

    it('returns all current 2025 league users', async () => {
        // no parameter = default to current league
        const leagueUsers = await sleeper.getLeagueUsers();
        expect(leagueUsers).toEqual(raw2025users);
    });

    it('returns all current 2021 league users', async () => {
        const leagueId2024 = '1118232706736807936';
        const leagueUsers = await sleeper.getLeagueUsers(leagueId2024);
        expect(leagueUsers).toEqual(raw2024users);
    });

    it("throws NotFoundError when league id is not a valid league Id", async () => {
        const leagueId = '5535';

        await expect(
            sleeper.getLeagueUsers(leagueId)
        ).rejects.toBeInstanceOf(NotFoundError);
    });
});

describe("determines active and inactive league users", () => {
    it("I know this dataset is accurate, lionel is not in our league (testing intersection, difference)", () => {
        const result = determineActiveUsers(allDbUsers, raw2025users);
        const answer = {
            active: new Set([
                '205536533820743680',
                '726223114991685632',
                '726308671558070272',
                '726512017078317056',
                '726514895868203008',
                '726906315338768384',
                '728042185152389120',
                '728043838215675904',
                '730905441533558784',
                '730912754680061952',
                '734514251284230144',
                '734515720674725888'
            ]),
            inactive: new Set(['726514990504280064'])
        };

        expect(result).toEqual(answer);
    });

    it("accounts for league user who is not present in the database (testing difference, intersection, union)", () => {
        const allDbUsers = [
            {
                userId: "205536533820743680",
                displayName: "brockriebe",
                teamName: "Team A",
                avatarId: "91cef337aed16e049637b7bdf164e711",
                isActive: true,
                createdAt: new Date("2025-12-17T07:15:06.843Z"),
                updatedAt: new Date("2025-12-18T06:20:12.930Z")
            },
            {
                userId: "726223114991685632",
                displayName: "destindorsett",
                teamName: "Team B",
                avatarId: "97ffcef5aea7451f445374ce2245fb18",
                isActive: true,
                createdAt: new Date("2025-12-17T07:15:06.843Z"),
                updatedAt: new Date("2025-12-18T06:20:12.930Z")
            },
            {
                userId: "999999999999999999",
                displayName: "CaptainSnugglepants",
                teamName: "The Couch Potatoes",
                avatarId: "deadbeefcafebabe0000000000000000",
                isActive: false,
                createdAt: new Date("2025-12-17T07:15:06.843Z"),
                updatedAt: new Date("2025-12-18T06:20:12.930Z")
            }
        ];

        const liveUsers = [
            {
                user_id: '205536533820743680',
                display_name: 'brockriebe',
                metadata: {
                    team_name: 'Team A'
                },
                avatar: '91cef337aed16e049637b7bdf164e711'
            },
            {
                user_id: '726223114991685632',
                display_name: 'destindorsett',
                metadata: {
                    team_name: 'Team B'
                },
                avatar: '97ffcef5aea7451f445374ce2245fb18'
            },
            // new user not in DB
            {
                user_id: 'u4',
                display_name: 'Diana',
                metadata: {
                    team_name: 'Team D'
                },
                avatar: 'cafebabedeadbeef0000000000000001'
            }
        ];

        const expected = {
            active: new Set(['205536533820743680', '726223114991685632', 'u4']),  // two DB users + new live user
            inactive: new Set(['999999999999999999'])  // user in DB not in live
        };

        expect(determineActiveUsers(allDbUsers, liveUsers)).toEqual(expected);
    });

    it("marks all DB users as active when live users match exactly", () => {
        const allDbUsers = [
            {
                userId: "205536533820743680",
                displayName: "brockriebe",
                teamName: "Team A",
                avatarId: "91cef337aed16e049637b7bdf164e711",
                isActive: true,
                createdAt: new Date("2025-12-17T07:15:06.843Z"),
                updatedAt: new Date("2025-12-18T06:20:12.930Z")
            },
            {
                userId: "726223114991685632",
                displayName: "destindorsett",
                teamName: "Team B",
                avatarId: "97ffcef5aea7451f445374ce2245fb18",
                isActive: true,
                createdAt: new Date("2025-12-17T07:15:06.843Z"),
                updatedAt: new Date("2025-12-18T06:20:12.930Z")
            },
            {
                userId: "999999999999999999",
                displayName: "CaptainSnugglepants",
                teamName: "The Couch Potatoes",
                avatarId: "deadbeefcafebabe0000000000000000",
                isActive: false,
                createdAt: new Date("2025-12-17T07:15:06.843Z"),
                updatedAt: new Date("2025-12-18T06:20:12.930Z")
            }
        ];

        const liveUsers = [
            {
                user_id: '205536533820743680',
                display_name: 'brockriebe',
                metadata: { team_name: 'Team A' },
                avatar: '91cef337aed16e049637b7bdf164e711'
            },
            {
                user_id: '726223114991685632',
                display_name: 'destindorsett',
                metadata: { team_name: 'Team B' },
                avatar: '97ffcef5aea7451f445374ce2245fb18'
            },
            {
                user_id: '999999999999999999',
                display_name: 'CaptainSnugglepants',
                metadata: { team_name: 'The Couch Potatoes' },
                avatar: 'deadbeefcafebabe0000000000000000'
            }
        ];

        const expected = {
            active: new Set(['205536533820743680', '726223114991685632', '999999999999999999']),
            inactive: new Set()
        };

        expect(determineActiveUsers(allDbUsers, liveUsers)).toEqual(expected);
    });

    it("marks all DB users as inactive when no live users match", () => {
        const allDbUsers = [
            {
                userId: "205536533820743680",
                displayName: "brockriebe",
                teamName: "Team A",
                avatarId: "91cef337aed16e049637b7bdf164e711",
                isActive: true,
                createdAt: new Date("2025-12-17T07:15:06.843Z"),
                updatedAt: new Date("2025-12-18T06:20:12.930Z")
            },
            {
                userId: "726223114991685632",
                displayName: "destindorsett",
                teamName: "Team B",
                avatarId: "97ffcef5aea7451f445374ce2245fb18",
                isActive: true,
                createdAt: new Date("2025-12-17T07:15:06.843Z"),
                updatedAt: new Date("2025-12-18T06:20:12.930Z")
            },
            {
                userId: "999999999999999999",
                displayName: "CaptainSnugglepants",
                teamName: "The Couch Potatoes",
                avatarId: "deadbeefcafebabe0000000000000000",
                isActive: false,
                createdAt: new Date("2025-12-17T07:15:06.843Z"),
                updatedAt: new Date("2025-12-18T06:20:12.930Z")
            }
        ];

        const liveUsers = [
            // no live users matching DB
            {
                user_id: 'u1',
                display_name: 'Newbie1',
                metadata: { team_name: 'Team X' },
                avatar: 'aaa111'
            },
            {
                user_id: 'u2',
                display_name: 'Newbie2',
                metadata: { team_name: 'Team Y' },
                avatar: 'bbb222'
            }
        ];

        const expected = {
            active: new Set(['u1', 'u2']), // all new live users
            inactive: new Set(['205536533820743680', '726223114991685632', '999999999999999999']) // all DB users not in live
        };

        expect(determineActiveUsers(allDbUsers, liveUsers)).toEqual(expected);
    });

    it('throws an error if raw sleeper data passed is empty', () => {
        expect(() => determineActiveUsers(allDbUsers, [])).toThrowError();
    });
});

describe("league user normalization tests", () => {
    const nullTeamName: RawLeagueUser = Reflect.get(waylenRaw, "default");
    const definedTeamName: RawLeagueUser = Reflect.get(calebRaw, "default");
    const caleb: StrictLeagueUser = Reflect.get(calebNormalized, "default");
    const waylen: StrictLeagueUser = Reflect.get(waylenNormalized, "default");

    it("handles null team_name defined and null", () => {
        const nullableLeagueUserWaylen = undefinedToNullDeep(nullTeamName) as NullableRawLeagueUser;
        const nullResult = normalizeLeagueUser(nullableLeagueUserWaylen);
        const nullableLeagueUserCaleb = undefinedToNullDeep(definedTeamName) as NullableRawLeagueUser;
        const definedResult = normalizeLeagueUser(nullableLeagueUserCaleb);
        expect(nullResult.teamName).toBeNull();
        expect(definedResult.teamName).toBeDefined();
    });

    it("normalizes a single user correctly: normalizeLeagueUser()", () => {
        const waylenTest = normalizeLeagueUser(undefinedToNullDeep(nullTeamName) as NullableRawLeagueUser);
        const calebTest = normalizeLeagueUser(undefinedToNullDeep(definedTeamName) as NullableRawLeagueUser);
        const notStrictObject = { ...caleb, extraProp: "shouldn't exist after normalization" };
        expect(calebTest).toEqual(caleb);
        expect(waylenTest).toEqual(waylen);
        expect(Object.keys(calebTest)).toEqual(Object.keys(caleb));
        expect(caleb).not.toEqual(notStrictObject);
        expect(() => strictLeagueUserSchema.parse(notStrictObject)).toThrow();
        expect(caleb.avatarId).toBeTypeOf('string');
        expect(caleb.displayName).toBeTypeOf('string');
        expect(caleb.teamName).toBeTypeOf('string');
        expect(caleb.userId).toBeTypeOf('string');
        expect(caleb.isActive).toBeTypeOf('boolean');
    });

    it("normalizes an array of league users correctly: rawToNormalizedLeagueUser()", () => {
        const result = rawToNormalizedLeagueUser(rawAllLeagueUsers);
        expect(result).toEqual(uniqueAllLeagueUsers);
    });

    it("runs buildLeagueUsersHistory and returns normalized users", async () => {
        const result = await buildLeagueUsersHistory();
        expect(result.length).toBeGreaterThan(0); // sanity check
        expect(result[0]).toHaveProperty("userId");
        expect(result[0]).toHaveProperty("displayName");
        expect(result[0]).toHaveProperty("teamName");
        expect(result[0]).toHaveProperty("avatarId");
        expect(result[0]).toHaveProperty("isActive");
    });

    it("syncLeagueUsers runs and returns normalized users", async () => {
        const result = await syncLeagueUsers();
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty("userId");
        expect(result[0]).toHaveProperty("displayName");
        expect(result[0]).toHaveProperty("teamName");
        expect(result[0]).toHaveProperty("avatarId");
        expect(result[0]).toHaveProperty("isActive");
    });

});