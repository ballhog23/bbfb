// Sample data. The real page gets these values from the server.

export type SeasonChampion = {
    season: number;
    team: string;
    record: string;
    totalPoints: string;
    finalsScore: string;
    defeated: string;
    mvp: string;
    quote: string;
    /** Caleb writes this by hand once a year. Empty shows the default roast. */
    roast?: string;
};

/** One Sleeper user and the number of championships they won. */
export type Champion = {
    username: string;
    championships: number;
};

export type ScoringRecord = {
    season: number;
    team: string;
    points: string;
};

export type ChampionsHallData = {
    seasons: SeasonChampion[];
    champions: Champion[];
    record: ScoringRecord;
};

export const SAMPLE_CHAMPIONS_HALL: ChampionsHallData = {
    seasons: [
        {
            season: 2025,
            team: "Team One",
            record: "11-3",
            totalPoints: "1,842.36",
            finalsScore: "178.42",
            defeated: "Team Four",
            mvp: "Josh Allen",
            quote: "Twisters and titties, LFG",
            roast: `We will never understand why you want to send us all of your shitty players for our best players, but you do you broski. We enjoy opening up your trade requests because we know we will get to say, "In your f*cking dreams. Pussy."`,
        },
        {
            season: 2024,
            team: "Team Two",
            record: "10-4",
            totalPoints: "1,790.18",
            finalsScore: "151.06",
            defeated: "Team Three",
            mvp: "Ja'Marr Chase",
            quote: "We should put an * on this one...",
        },
        {
            season: 2023,
            team: "Team Three",
            record: "9-5",
            totalPoints: "1,711.54",
            finalsScore: "139.88",
            defeated: "Team Five",
            mvp: "Christian McCaffrey",
            quote: "If we added espn support, you would see that this is really #3",
        },
        {
            season: 2022,
            team: "Team Two",
            record: "12-2",
            totalPoints: "1,905.72",
            finalsScore: "164.30",
            defeated: "Team Six",
            mvp: "Justin Jefferson",
            quote: "If we added espn support, you would see that this is really #2",
        },
        {
            season: 2021,
            team: "Team Five",
            record: "8-6",
            totalPoints: "1,650.90",
            finalsScore: "127.14",
            defeated: "Team One",
            mvp: "Jonathan Taylor",
            quote: "I like turtles",
        },
    ],
    champions: [
        { username: "Twisted TiT Teas", championships: 1 },
        { username: "bleed median", championships: 2 },
        { username: "JerrysGloryHole", championships: 1 },
        { username: "sample_user", championships: 1 },
    ],
    record: {
        season: 2025,
        team: "Team One",
        points: "178.42",
    },
};
