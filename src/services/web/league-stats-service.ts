import { selectAllLeaguesIdsAndSeasons } from "../../db/queries/leagues.js";

type StatsCard = {
    title: string;
    icon: string;
    value: string | number;
    desc: string;
    roast: string;
    badge?: string;
    variant: 'primary' | 'secondary' | 'destructive' | 'default';
};

type StatsSection = {
    icon: string;
    title: string;
    subtitle: string;
    cols: number;
    cards: StatsCard[];
};

export function getAllTimeStats(): StatsSection[] {
    return [
        {
            icon: 'trophy', title: 'The Big Numbers', subtitle: 'The all-time ledger of fantasy dominance', cols: 3,
            cards: [
                { title: 'Total Points Scored', icon: 'target', value: 0, desc: 'Every point, every season, every heartbreak', roast: 'The collective output of years of questionable decisions', badge: 'All-Time', variant: 'primary' },
                { title: 'Total Games Played', icon: 'trophy', value: 0, desc: 'Across every season in league history', roast: "That's a lot of Sundays sacrificed", variant: 'default' },
                { title: 'All-Time Avg PPG', icon: 'trending-up', value: '0.0', desc: 'The historical baseline for fantasy output', roast: 'The number that separates contenders from pretenders', badge: 'All-Time', variant: 'secondary' },
            ],
        },
        {
            icon: 'flame', title: 'Scoring Records', subtitle: 'The all-time highs, lows, and "how did that happen?" moments', cols: 3,
            cards: [
                { title: 'Most Points in a Game', icon: 'trending-up', value: 0, desc: 'The single greatest week in league history', roast: 'They woke up and chose violence', badge: 'Record', variant: 'primary' },
                { title: 'Fewest Points in a Game', icon: 'trending-down', value: 0, desc: 'A performance that lives in infamy', roast: 'Did they even set a lineup?', variant: 'destructive' },
                { title: 'Most Points in a Loss', icon: 'skull', value: 0, desc: 'The cruelest loss in league history', roast: 'Wrong place, wrong time', variant: 'destructive' },
                { title: 'Fewest Points in a Win', icon: 'crown', value: 0, desc: 'The luckiest win the league has ever witnessed', roast: 'Lucky to be alive', variant: 'secondary' },
                { title: 'Highest Combined Matchup', icon: 'zap', value: 0, desc: 'The all-time shootout', roast: 'Both teams chose violence', badge: 'Record', variant: 'primary' },
                { title: 'Lowest Combined Matchup', icon: 'target', value: 0, desc: 'The worst showing in league history', roast: 'Nobody showed up. Across all of history, this was the worst.', variant: 'default' },
            ],
        },
        {
            icon: 'zap', title: 'Point Margins', subtitle: 'Every blowout and nail-biter across league history', cols: 3,
            cards: [
                { title: 'Largest Margin of Victory', icon: 'zap', value: 0, desc: 'The most dominant single-game performance ever', roast: "That's a blowout for the ages", badge: 'Record', variant: 'primary' },
                { title: 'Smallest Margin of Victory', icon: 'target', value: 0, desc: 'The closest game in league history', roast: 'Monday night nightmares are made of margins like this', variant: 'secondary' },
                { title: 'Games Decided by < 1 pt', icon: 'flame', value: 0, desc: 'Decimal point drama across all seasons', roast: 'Every one of these caused a Monday morning meltdown', variant: 'destructive' },
                { title: 'Avg Win Margin', icon: 'trending-up', value: '0.0', desc: 'Average margin across all wins in league history', roast: 'The comfort zone of victory, quantified for all time', variant: 'primary' },
                { title: 'Avg Loss Margin', icon: 'trending-down', value: '0.0', desc: 'Average margin across all losses in league history', roast: 'At least most of them were quick', variant: 'destructive' },
                { title: 'Blowout Rate (20+ pts)', icon: 'zap', value: '0%', desc: 'All-time annihilation rate', roast: 'The percentage of games where mercy should have been shown', variant: 'default' },
            ],
        },
        {
            icon: 'flame', title: 'The Streaks', subtitle: 'The longest runs of glory and despair in league history', cols: 2,
            cards: [
                { title: 'Longest Winning Streak', icon: 'trending-up', value: 0, desc: 'An unstoppable force that echoes through the ages', roast: 'Riding high across seasons', badge: 'Record', variant: 'secondary' },
                { title: 'Longest Losing Streak', icon: 'trending-down', value: 0, desc: 'A character-building era that no one wants to relive', roast: 'We learn from these... right?', variant: 'destructive' },
            ],
        },
        {
            icon: 'star', title: 'All-Time Leaderboard', subtitle: 'The legends atop the all-time mountain', cols: 3,
            cards: [
                { title: 'All-Time Points Leader', icon: 'crown', value: 0, desc: 'The all-time scoring king', roast: 'Volume over everything', badge: 'Leader', variant: 'primary' },
                { title: 'Most All-Time Wins', icon: 'trophy', value: 0, desc: 'The winningest manager in league history', roast: 'Stacking Ws across eras', badge: 'Leader', variant: 'secondary' },
                { title: 'Most All-Time Losses', icon: 'skull', value: 0, desc: 'Someone has to hold the all-time floor down', roast: 'Longevity has its downsides', variant: 'destructive' },
            ],
        },
        {
            icon: 'skull', title: "That's Gotta Hurt", subtitle: 'The universe has had a sick sense of humor since day one', cols: 3,
            cards: [
                { title: 'Most Points Faced (All-Time)', icon: 'target', value: 0, desc: 'The universe has had a vendetta across every season', roast: 'Schedule from hell, lifetime edition', variant: 'destructive' },
                { title: 'Most Weekly Top Scores', icon: 'crown', value: 0, desc: 'Consistently on top of the weekly leaderboard, all-time', roast: 'Consistency is king', badge: 'Leader', variant: 'primary' },
                { title: 'Most Weekly Last Places', icon: 'skull', value: 0, desc: 'A permanent resident of the all-time basement', roast: 'Somebody has to hold the floor down', variant: 'destructive' },
            ],
        },
    ];
}

export async function assembleAllTimeStatsPageData() {
    return { sections: getAllTimeStats() };
}

function getSeasonStats(season: string): StatsSection[] {
    return [
        {
            icon: 'trophy', title: 'The Big Numbers', subtitle: `The ${season} season by the numbers`, cols: 3,
            cards: [
                { title: 'Total Points Scored', icon: 'target', value: 0, desc: `Every point scored in the ${season} season`, roast: 'The collective output of one season of questionable decisions', variant: 'primary' },
                { title: 'Games Played', icon: 'trophy', value: 0, desc: `Total matchups this season`, roast: 'Another season in the books', variant: 'default' },
                { title: 'Season Avg PPG', icon: 'trending-up', value: '0.0', desc: `The ${season} scoring baseline`, roast: 'Where did this season stack up?', variant: 'secondary' },
            ],
        },
        {
            icon: 'flame', title: 'Scoring Records', subtitle: `The highs and lows of the ${season} season`, cols: 3,
            cards: [
                { title: 'Most Points in a Game', icon: 'trending-up', value: 0, desc: `The best single week of ${season}`, roast: 'They woke up and chose violence', badge: 'Season High', variant: 'primary' },
                { title: 'Fewest Points in a Game', icon: 'trending-down', value: 0, desc: `The worst single week of ${season}`, roast: 'Did they even set a lineup?', variant: 'destructive' },
                { title: 'Most Points in a Loss', icon: 'skull', value: 0, desc: `The cruelest loss of the ${season} season`, roast: 'Wrong place, wrong time', variant: 'destructive' },
                { title: 'Fewest Points in a Win', icon: 'crown', value: 0, desc: `The luckiest win of ${season}`, roast: 'Lucky to be alive', variant: 'secondary' },
                { title: 'Highest Combined Matchup', icon: 'zap', value: 0, desc: `The ${season} shootout of the year`, roast: 'Both teams chose violence', badge: 'Season High', variant: 'primary' },
                { title: 'Lowest Combined Matchup', icon: 'target', value: 0, desc: `The worst combined showing of ${season}`, roast: 'Nobody showed up that week', variant: 'default' },
            ],
        },
        {
            icon: 'zap', title: 'Point Margins', subtitle: `Blowouts and nail-biters of the ${season} season`, cols: 3,
            cards: [
                { title: 'Largest Margin of Victory', icon: 'zap', value: 0, desc: `The most dominant win of ${season}`, roast: "That's a blowout!", badge: 'Season High', variant: 'primary' },
                { title: 'Smallest Margin of Victory', icon: 'target', value: 0, desc: `The closest game of ${season}`, roast: 'Heart attack material', variant: 'secondary' },
                { title: 'Games Decided by < 1 pt', icon: 'flame', value: 0, desc: `Decimal point drama this season`, roast: 'Monday night nightmares', variant: 'destructive' },
                { title: 'Avg Win Margin', icon: 'trending-up', value: '0.0', desc: `Average win margin this season`, roast: 'Comfort zone, quantified', variant: 'primary' },
                { title: 'Avg Loss Margin', icon: 'trending-down', value: '0.0', desc: `Average loss margin this season`, roast: 'At least it was quick... usually', variant: 'destructive' },
                { title: 'Blowout Rate (20+ pts)', icon: 'zap', value: '0%', desc: `Season annihilation rate`, roast: 'Mercy rule should exist', variant: 'default' },
            ],
        },
        {
            icon: 'flame', title: 'The Streaks', subtitle: `The longest runs of the ${season} season`, cols: 2,
            cards: [
                { title: 'Longest Winning Streak', icon: 'trending-up', value: 0, desc: `The hottest stretch of ${season}`, roast: 'Riding high!', badge: 'Season Best', variant: 'secondary' },
                { title: 'Longest Losing Streak', icon: 'trending-down', value: 0, desc: `The coldest stretch of ${season}`, roast: 'Character-building moments', variant: 'destructive' },
            ],
        },
        {
            icon: 'star', title: 'Season Leaderboard', subtitle: `Who ran the ${season} season`, cols: 3,
            cards: [
                { title: 'Season Points Leader', icon: 'crown', value: 0, desc: `The top scorer of ${season}`, roast: 'Volume over everything this season', badge: 'Leader', variant: 'primary' },
                { title: 'Winningest Manager', icon: 'trophy', value: 0, desc: `Most wins in the ${season} season`, roast: 'They owned this season', badge: 'Leader', variant: 'secondary' },
                { title: 'Most Losses', icon: 'skull', value: 0, desc: `Most losses in the ${season} season`, roast: 'Better luck next year', variant: 'destructive' },
            ],
        },
        {
            icon: 'skull', title: "That's Gotta Hurt", subtitle: `The ${season} season was not kind to everyone`, cols: 3,
            cards: [
                { title: 'Most Points Faced', icon: 'target', value: 0, desc: `Schedule from hell in ${season}`, roast: 'The universe had a vendetta this season', variant: 'destructive' },
                { title: 'Most Weekly Top Scores', icon: 'crown', value: 0, desc: `Most weeks as the top scorer in ${season}`, roast: 'King of the week', badge: 'Leader', variant: 'primary' },
                { title: 'Most Weekly Last Places', icon: 'skull', value: 0, desc: `Most weeks in the basement in ${season}`, roast: 'Somebody had to hold the floor down', variant: 'destructive' },
            ],
        },
    ];
}

export async function assembleLeagueStatsPageData(leagueId: string) {
    const allLeagues = await selectAllLeaguesIdsAndSeasons();
    const league = allLeagues.find(l => l.leagueId === leagueId);
    const season = league?.season ?? 'Unknown';

    return {
        sections: getSeasonStats(season),
        allLeagues,
        currentLeagueId: leagueId,
        currentSeason: season,
    };
}
