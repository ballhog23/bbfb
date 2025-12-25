import {
    strictSleeperUserSchema,
    type RawSleeperUser, StrictSleeperUser
} from '../lib/zod.js';
import { Sleeper } from "../lib/sleeper.js";
import { normalizeString } from "../lib/helpers.js";
import { insertSleeperUser } from "../db/queries/sleeper-users.js";
import { SelectSleeperUser } from "src/db/schema.js";

export async function syncSleeperUsers(sleeperUserIds: string[]) {
    const normalizedUsers = await buildSleeperUsers(sleeperUserIds);
    return insertSleeperUsers(normalizedUsers);
}

export async function buildAndInsertSleeperUsersHistory(sleeperUserIds: string[]) {
    const sleeperUsers = await buildSleeperUsers(sleeperUserIds);

    return insertSleeperUsers(sleeperUsers);
}

export async function buildSleeperUsers(sleeperUserIds: string[]) {
    const rawUsers = await getAllSleeperUsersHistory(sleeperUserIds);
    return rawToNormalizedSleeperUsers(rawUsers);
}

export async function insertSleeperUsers(sleeperUsers: StrictSleeperUser[]) {
    const successfulUsers: SelectSleeperUser[] = [];
    const failedInsertUsers: { userId: string, error: unknown; }[] = [];

    for (const sleeperUser of sleeperUsers) {
        try {
            const result = await insertSleeperUser(sleeperUser);
            successfulUsers.push(result);
        } catch (error) {
            failedInsertUsers.push({ userId: sleeperUser.userId, error });
        }
    }

    if (failedInsertUsers.length > 0) {
        throw new AggregateError(failedInsertUsers.map(e => e.error), 'Failed to insert sleeper users');
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
    const normalizedSleeperUsers = rawUsers.map(
        user => normalizeSleeperUser(user)
    );

    return normalizedSleeperUsers.map(user => strictSleeperUserSchema.parse(user));
}