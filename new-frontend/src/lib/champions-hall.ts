import type { Champion, SeasonChampion } from "@data/sample/champions-hall";

export const DEFAULT_ROAST =
    "That's a lot of points for someone who claims to have a job.";

export function roastFor(season: SeasonChampion): string {
    return season.roast?.trim() || DEFAULT_ROAST;
}

/** Users with more than one championship, most championships first. */
export function dynastyChampions(champions: Champion[]): Champion[] {
    return champions
        .filter((champion) => champion.championships > 1)
        .sort((a, b) => b.championships - a.championships);
}

/** The dynasty title and quote change with the number of dynasty users. */
export function dynastyCopy(count: number) {
    const many = count > 1;
    return {
        titleStart: many ? "These are the" : "This is the",
        noun: many ? "f*ckers" : "f*cker",
        titleEnd: many
            ? "who have won more than one championship"
            : "who has won more than one championship",
        quote: `Congrats, now go touch grass you f*cking ${many ? "nerds" : "nerd"}. 🖕🤣`,
    };
}

/** The newest season is the reigning champion. */
export function seasonEyebrow(season: number, isReigning: boolean): string {
    return isReigning
        ? `${season}, give it up for the reigning champ`
        : `${season} champ`;
}

/** Up to two letters from the first two words of a team name. */
export function initials(team: string): string {
    return team
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join("");
}
