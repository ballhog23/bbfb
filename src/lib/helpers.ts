export function undefinedToNullDeep<T>(v: T): T {
    // if value is undefined, return null as T
    if (v === undefined) return null as T;
    // if value is null, or is not type object (array or object) return value
    if (v === null || typeof v !== 'object') return v;
    // if value is array, recurse to check for deeply nested undefined values
    if (Array.isArray(v)) {
        return v.map((x) => undefinedToNullDeep(x)) as T;
    }
    // build new object, check for undefined values, set undefined === null return new object
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(v as Record<string, unknown>)) {
        out[key] = undefinedToNullDeep(val);
    }

    return out as T;
}

export function buildUserAvatarURLs(avatarId: string): [
    `https://sleepercdn.com/avatars/thumbs/${string}`,
    `https://sleepercdn.com/avatars/${string}`
] {
    const thumbnailURL =
        `https://sleepercdn.com/avatars/thumbs/${avatarId}` as `https://sleepercdn.com/avatars/thumbs/${string}`;
    const fullSizeURL =
        `https://sleepercdn.com/avatars/${avatarId}` as `https://sleepercdn.com/avatars/${string}`;
    return [thumbnailURL, fullSizeURL];
}

export function normalizeString(string: string) {
    if (typeof string !== "string") throw new TypeError(`Expected string value, recieved ${typeof string}`);
    if (string.length === 0) return "";

    const invisibleCharsRegex = /[\u200B\u200C\u200D\u200E\u200F\u2060\u202F\uFEFF]/g;
    const removedinvisibleChars = string.replace(invisibleCharsRegex, "");
    const collapedWhiteSpaceRegex = /\s+/g; // matches consecutive white space
    const collapsedWhiteSpace = removedinvisibleChars.replace(collapedWhiteSpaceRegex, " "); // replace consecutive whitespaces with single space
    const trimmed = collapsedWhiteSpace.trim();
    const normalized = trimmed.normalize("NFC");
    return normalized;
}

