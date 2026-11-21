export type PageKey =
    | "home"
    | "matchups"
    | "champions-hall"
    | "sacko-hall"
    | "rivalry"
    | "league-stats";

export type NavLink = {
    key: PageKey;
    label: string;
    href: string;
};

export const SITE = {
    name: "BBFB",
    fullName: "Bleed Blue Fantasy Football",
    themeColor: "#111827",
    author: {
        name: "Caleb Pirkle",
        href: "https://calebpirkle.com",
    },
} as const;

export const MAIN_NAV: NavLink[] = [
    { key: "home", label: "Home", href: "/" },
    { key: "matchups", label: "Matchups", href: "/matchups" },
];

export const LEAGUE_INFO_NAV: NavLink[] = [
    { key: "champions-hall", label: "Champions Hall", href: "/champions-hall" },
    { key: "sacko-hall", label: "Sacko Hall", href: "/sacko-hall" },
    { key: "rivalry", label: "Rivalry", href: "/rivalry" },
    { key: "league-stats", label: "League Stats", href: "/league-stats" },
];

export const EXTERNAL_SITES = [
    { label: "sleeper.com", href: "https://sleeper.com/" },
    { label: "nfl.com", href: "https://www.nfl.com/" },
];
