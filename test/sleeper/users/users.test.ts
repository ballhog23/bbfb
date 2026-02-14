import {
    strictLeagueUserSchema, type NullableRawLeagueUser,
    type RawLeagueUser, type StrictLeagueUser
} from "../../../src/lib/zod.js";
import { describe, expect, it, vi } from "vitest";
import { Sleeper } from "../../../src/lib/sleeper";
import { NotFoundError } from "../../../src/lib/errors";
import {
    normalizeLeagueUser,
    rawToNormalizedLeagueUsers, syncLeagueUsers,
    buildLeagueUsersHistory
} from "../../../src/services/api/league-users-service.js";
import { undefinedToNullDeep } from "../../../src/lib/helpers.js";
import { SelectLeagueUser } from "../../../src/db/schema.js";
import * as raw2025LeagueUsers from "./raw/league-users-2025.json";
import * as raw2024LeagueUsers from "./raw/league-users-2024.json";
import * as dbLeagueUsers from "./normalized/db/database-all-league-users.json";
import * as waylenRaw from "./raw/raw-user-726512017078317056.json";
import * as calebRaw from "./raw/raw-user-730912754680061952.json";
import * as waylenNormalized from "./normalized/normalized-user-726512017078317056.json";
import * as calebNormalized from "./normalized/normalized-user-730912754680061952.json";
import * as uniqueNormalizedLeagueUsers from "./normalized/user-history-normalized.json";
import * as uniqueRawLeagueUsers from "./raw/unique-league-user-history.json";

const rawAllLeagueUsers: RawLeagueUser[] = Reflect.get(uniqueRawLeagueUsers, "default");
const uniqueAllLeagueUsers: RawLeagueUser[] = Reflect.get(uniqueNormalizedLeagueUsers, "default");
const raw2025users: RawLeagueUser[] = Reflect.get(raw2025LeagueUsers, "default");
const raw2024users: RawLeagueUser[] = Reflect.get(raw2024LeagueUsers, "default");
const allDbUsers: SelectLeagueUser[] = Reflect.get(dbLeagueUsers, "default");
const leagueId2024 = '1118232706736807936';
const leagueId2025 = '1257436036187824128';

describe('Sleeper.getLeagueUsers (MSW intercepted)', async () => {
    const sleeper = new Sleeper();

    // todo: test for current users once 2026 season starts


    it('returns all current 2024 league users', async () => {
        const leagueUsers = await sleeper.getLeagueUsers(leagueId2024);
        expect(leagueUsers).toEqual(raw2024users);
    });

    it("throws NotFoundError when league id is not a valid league Id", async () => {
        const leagueId = '5535';

        await expect(
            sleeper.getLeagueUsers(leagueId)
        ).rejects.toBeInstanceOf(Error);
    });
});

// todo: write tests for league user normalization