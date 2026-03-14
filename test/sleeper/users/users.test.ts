import { describe, expect, it } from "vitest";
import { Sleeper } from "../../../src/lib/sleeper";
import * as raw2024LeagueUsers from "./raw/league-users-2024.json";
import { type RawLeagueUser, } from "../../../src/lib/zod.js";


const raw2024users: RawLeagueUser[] = Reflect.get(raw2024LeagueUsers, "default");

const leagueId2024 = '1118232706736807936';


describe('Sleeper.getLeagueUsers (MSW intercepted)', async () => {
    const sleeper = new Sleeper();

    // todo: test for current users once 2026 season starts


    it('returns all current 2024 league users', async () => {
        const leagueUsers = await sleeper.getLeagueUsers(leagueId2024);
        expect(leagueUsers).toEqual(raw2024users);
    });
});

// todo: write tests for league user normalization