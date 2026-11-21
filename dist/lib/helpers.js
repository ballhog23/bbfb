import { selectAllLeagues, selectAllCompletedLeagues, } from "../db/queries/leagues.js";
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
export function undefinedToNullDeep(v) {
    if (v === undefined)
        return null;
    if (v === null || typeof v !== "object")
        return v;
    if (Array.isArray(v)) {
        return v.map((x) => undefinedToNullDeep(x));
    }
    const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);
    const out = Object.create(null);
    for (const [key, val] of Object.entries(v)) {
        if (!UNSAFE_KEYS.has(key)) {
            // eslint-disable-next-line security/detect-object-injection
            out[key] = undefinedToNullDeep(val);
        }
    }
    return out;
}
export function normalizeString(string) {
    if (typeof string !== "string")
        throw new TypeError(`Expected string value, recieved ${typeof string}`);
    if (string.length === 0)
        return "";
    const invisibleCharsRegex = /[\u200B\u200C\u200D\u200E\u200F\u2060\u202F\uFEFF]/g;
    const removedinvisibleChars = string.replace(invisibleCharsRegex, "");
    // matches consecutive white space
    const collapedWhiteSpaceRegex = /\s+/g;
    // replace consecutive whitespaces with single space
    const collapsedWhiteSpace = removedinvisibleChars.replace(collapedWhiteSpaceRegex, " ");
    const trimmed = collapsedWhiteSpace.trim();
    const normalized = trimmed.normalize("NFC");
    return normalized;
}
export function resolveAvatarSrc(teamAvatar, userAvatar, owner) {
    const isTwistedTitTeas = owner && owner.toLowerCase().includes("twistedtitteas");
    return isTwistedTitTeas ? userAvatar : (teamAvatar ?? userAvatar);
}
export function buildUserAvatarURLs(avatarId) {
    if (avatarId.length === 0)
        throw new Error("You must pass a valid string greater than 0 in length");
    return [
        `https://sleepercdn.com/avatars/thumbs/${avatarId}`,
        `https://sleepercdn.com/avatars/${avatarId}`,
    ];
}
export async function buildLeagueHistoryIds() {
    return (await selectAllLeagues()).map(({ leagueId }) => leagueId);
}
export async function buildCompletedLeaguesIds() {
    return (await selectAllCompletedLeagues()).map(({ leagueId }) => leagueId);
}
export const weeks = Array.from({ length: 17 }, (v, i) => i + 1);
export function groupAdjacentMatchups(matchupsArray) {
    if (matchupsArray.length % 2 !== 0)
        throw new Error("Matchups array passed is odd numbered in length");
    const matchups = [];
    for (let i = 0; i < matchupsArray.length; i += 2) {
        // eslint-disable-next-line security/detect-object-injection
        matchups.push([matchupsArray[i], matchupsArray[i + 1]]);
    }
    return matchups;
}
