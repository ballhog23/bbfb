import {
    strictSleeperUserSchema,
    type RawSleeperUser, StrictSleeperUser
} from '../../lib/zod.js';
import { Sleeper } from "../../lib/sleeper.js";
import { normalizeString } from "../../lib/helpers.js";
import { insertSleeperUser } from "../../db/queries/sleeper-users.js";
import type { SelectSleeperUser } from "../../db/schema.js";

export async function syncSleeperUsers(sleeperUserIds: string[]) {
    const normalizedUsers = await buildSleeperUsers(sleeperUserIds);
    return await insertSleeperUsers(normalizedUsers);
}

export async function buildAndInsertSleeperUsersHistory(sleeperUserIds: string[]) {
    const sleeperUsers = await buildSleeperUsers(sleeperUserIds);
    const result = await insertSleeperUsers(sleeperUsers);
    return result;
}

export async function buildSleeperUsers(sleeperUserIds: string[]) {
    const rawUsers = await getAllSleeperUsersHistory(sleeperUserIds);
    return rawToNormalizedSleeperUsers(rawUsers);
}

export async function insertSleeperUsers(sleeperUsers: StrictSleeperUser[]) {
    const successfulUsers: SelectSleeperUser[] = [];
    // sequential insert is fine here, our league currently is at 13 total users
    // we've had one player replaced, max is 12 per league season right now
    // 13 total
    for (const sleeperUser of sleeperUsers) {
        const result = await insertSleeperUser(sleeperUser);
        successfulUsers.push(result);
    }

    return successfulUsers;
}

export async function getAllSleeperUsersHistory(sleeperUserIds: string[]) {
    const sleeper = new Sleeper();
    const uniqueUserIds = [...new Set(sleeperUserIds)];

    return await Promise.all(
        uniqueUserIds.map(userId => sleeper.getSleeperUser(userId))
    );
}

export function normalizeSleeperUser(rawUser: RawSleeperUser) {
    return {
        userName: normalizeString(rawUser.username),
        userId: normalizeString(rawUser.user_id),
        displayName: normalizeString(rawUser.display_name),
        avatarId: normalizeString(`https://sleepercdn.com/avatars/${rawUser.avatar}`),
    } satisfies StrictSleeperUser;
}

export function rawToNormalizedSleeperUsers(rawUsers: RawSleeperUser[]) {
    return rawUsers
        .map(user => normalizeSleeperUser(user))
        .map(user => strictSleeperUserSchema.parse(user));
}