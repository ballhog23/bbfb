import type { Request, Response, NextFunction, RequestHandler } from "express";
import { selectAllLeagues } from "../db/queries/leagues.js";
import { selectLeagueMatchupsByWeekWithoutByes } from "../db/queries/matchups.js";

export type AsyncRequestHandler<P = Record<string, any>> = (
    req: Request<P>,
    res: Response,
    next: NextFunction
) => Promise<void>;

export const asyncHandler = <P = Record<string, any>>(fn: AsyncRequestHandler<P>): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req as Request<P>, res, next)).catch(next);
    };
};

export function undefinedToNullDeep<T>(v: T): T {
    if (v === undefined) return null as T;

    if (v === null || typeof v !== 'object') return v;

    if (Array.isArray(v)) {
        return v.map((x) => undefinedToNullDeep(x)) as T;
    }

    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(v as Record<string, unknown>)) {
        out[key] = undefinedToNullDeep(val);
    }

    return out as T;
}

export function normalizeString(string: string) {
    if (typeof string !== "string") throw new TypeError(`Expected string value, recieved ${typeof string}`);
    if (string.length === 0) return "";

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

export function buildUserAvatarURLs(avatarId: string): AvatarURLs {
    if (avatarId.length === 0) throw new Error('You must pass a valid string greater than 0 in length');
    return [
        `https://sleepercdn.com/avatars/thumbs/${avatarId}`,
        `https://sleepercdn.com/avatars/${avatarId}`
    ] satisfies AvatarURLs;
}

type ThumbURL = `https://sleepercdn.com/avatars/thumbs/${string}`;
type FullURL = `https://sleepercdn.com/avatars/${string}`;
type AvatarURLs = [ThumbURL, FullURL];

export async function buildLeagueHistoryIds(): Promise<string[]> {
    return (await selectAllLeagues()).map(({ leagueId }) => leagueId);
}

export const weeks = Array.from({ length: 17 }, (v, i) => i + 1);

export type MatchupsWithoutByes = Awaited<ReturnType<typeof selectLeagueMatchupsByWeekWithoutByes>>;
export type MatchupRow = MatchupsWithoutByes[number];
export type MatchupTuple = [MatchupRow, MatchupRow];

export function groupAdjacentMatchups(matchupsArray: MatchupsWithoutByes): MatchupTuple[] {

    if (matchupsArray.length % 2 !== 0)
        throw new Error('Matchups array passed is odd numbered in length');

    const matchups: MatchupTuple[] = [];

    for (let i = 0; i < matchupsArray.length; i += 2) {
        matchups.push([matchupsArray[i], matchupsArray[i + 1]]);
    }

    return matchups;
}