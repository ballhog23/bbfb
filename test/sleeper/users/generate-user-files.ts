import type { RawLeagueUser } from "../../../src/lib/zod.js";
import { writeFile, } from "node:fs/promises";
import * as rawUsersHistory from "./raw/unique-league-user-history.json" with { type: 'json' };

const dir = import.meta.dirname;
const normalizedDir = `${dir}/normalized`;
const rawDir = `${dir}/raw`;
const rawUsers: RawLeagueUser[] = Reflect.get(rawUsersHistory, "default");

(async () => await writeUserJSONFile(rawUsers))();

async function writeUserJSONFile(rawUsers: RawLeagueUser[]) {
    await Promise.all(rawUsers.map(async (rawUser) => {
        const path = `${rawDir}/raw-user-${rawUser.user_id}.json`.toLowerCase();

        try {
            await writeFile(path, JSON.stringify(rawUser, null, 4));
            console.log(`Written ${path}`);
        } catch (error) {
            console.error(`Failed to write ${rawUser.user_id}:`, error);
        }
    }));
}