import { describe, expect, it } from "vitest";
import { Sleeper } from "../../../src/lib/sleeper";
import * as raw2024LeagueUsers from "./raw/league-users-2024.json";
import * as rawSleeperUserFixture from "./raw/raw-sleeper-user.json";
import { type RawLeagueUser, type RawSleeperUser } from "../../../src/lib/zod.js";


const raw2024users: RawLeagueUser[] = Reflect.get(raw2024LeagueUsers, "default");
const rawSleeperUser: RawSleeperUser = Reflect.get(rawSleeperUserFixture, "default");

const leagueId2024 = '1118232706736807936';


describe('Sleeper.getLeagueUsers (MSW intercepted)', async () => {
    const sleeper = new Sleeper();

    // todo: test for current users once 2026 season starts


    it('returns all current 2024 league users', async () => {
        const leagueUsers = await sleeper.getLeagueUsers(leagueId2024);
        expect(leagueUsers).toEqual(raw2024users);
    });
});

describe('Sleeper.getSleeperUser (MSW intercepted)', () => {
    const sleeper = new Sleeper();

    it('returns a single user by id', async () => {
        const result = await sleeper.getSleeperUser(rawSleeperUser.user_id);
        expect(result).toEqual(rawSleeperUser);
    });

    it('throws Error when user is not found', async () => {
        await expect(sleeper.getSleeperUser('nonexistent-id')).rejects.toBeInstanceOf(Error);
    });
});

// todo: write tests for league user normalization