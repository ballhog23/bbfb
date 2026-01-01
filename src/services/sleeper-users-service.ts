import {
    strictSleeperUserSchema,
    type RawSleeperUser, StrictSleeperUser
} from '../lib/zod.js';
import { Sleeper } from "../lib/sleeper.js";
import { normalizeString } from "../lib/helpers.js";
import { insertSleeperUser } from "../db/queries/sleeper-users.js";
import { SelectSleeperUser } from "src/db/schema.js";
import type { TX } from "../db/index.js";

export async function syncSleeperUsers(sleeperUserIds: string[]) {
    const normalizedUsers = await buildSleeperUsers(sleeperUserIds);
    return insertSleeperUsers(normalizedUsers);
}

export async function buildAndInsertSleeperUsersHistory(sleeperUserIds: string[], tx: TX) {
    const sleeperUsers = await buildSleeperUsers(sleeperUserIds);

    return insertSleeperUsers(sleeperUsers, tx);
}

export async function buildSleeperUsers(sleeperUserIds: string[]) {
    const rawUsers = await getAllSleeperUsersHistory(sleeperUserIds);
    return rawToNormalizedSleeperUsers(rawUsers);
}

export async function insertSleeperUsers(sleeperUsers: StrictSleeperUser[], tx?: TX) {
    const successfulUsers: SelectSleeperUser[] = [];
    // sequential insert is fine here, our league currently is at 13 total users
    // we've had one player replaced, max is 12 per league season right now
    // 13 total
    for (const sleeperUser of sleeperUsers) {
        const result = await insertSleeperUser(sleeperUser, tx);
        successfulUsers.push(result);
    }

    return successfulUsers;
}

export async function getAllSleeperUsersHistory(sleeperUserIds: string[]) {
    const sleeper = new Sleeper();
    const uniqueUserIds = [...new Set(sleeperUserIds)];

    return Promise.all(
        uniqueUserIds.map(userId => sleeper.getSleeperUser(userId))
    );
}

export function normalizeSleeperUser(rawUser: RawSleeperUser) {
    return {
        userName: normalizeString(rawUser.username),
        userId: normalizeString(rawUser.user_id),
        displayName: normalizeString(rawUser.display_name),
        avatarId: normalizeString(rawUser.avatar),
    } satisfies StrictSleeperUser;
}

export function rawToNormalizedSleeperUsers(rawUsers: RawSleeperUser[]) {
    return rawUsers
        .map(user => normalizeSleeperUser(user))
        .map(user => strictSleeperUserSchema.parse(user));
}