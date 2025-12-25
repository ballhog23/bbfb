import {
    strictSleeperUserSchema,
    type RawSleeperUser, StrictSleeperUser
} from '../lib/zod.js';
import { Sleeper } from "../lib/sleeper.js";
import { normalizeString } from "../lib/helpers.js";
import { insertSleeperUser } from "../db/queries/sleeper-users.js";

export async function buildAndInsertSleeperUsersHistory(sleeperUserIds: string[]) {
    const rawUsersHistory = await getAllSleeperUsers(sleeperUserIds);
    const sleeperUsers = rawToNormalizedSleeperUsers(rawUsersHistory);

    for (const sleeperUser of sleeperUsers) {
        await insertSleeperUser(sleeperUser);
    }

    return sleeperUsers;
}

export async function getAllSleeperUsers(sleeperUserIds: string[]) {
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

export async function syncSleeperUsers() {


}
