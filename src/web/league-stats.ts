import type { Request, Response } from "express";

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

// TODO: Replace with real data from service layer
function getAllTimeStats(): StatsSection[] {
    return [
        {
            icon: 'trophy', title: 'The Big Numbers', subtitle: 'Because size matters (in fantasy football)', cols: 4,
            cards: [
                { title: 'Total Points Scored', icon: 'target', value: 0, desc: 'All the points, all the glory', roast: 'Racking up the scoreboard!', badge: 'Hot', variant: 'primary' },
                { title: 'Games Played', icon: 'trophy', value: 851, desc: "That's a lot of Sundays", roast: 'Commitment level: Expert', variant: 'default' },
                { title: 'All-Time League Avg PPG', icon: 'trending-up', value: '0.0', desc: 'Consistency is key', roast: 'Steady as she goes', badge: 'Hot', variant: 'secondary' },
                { title: 'Avg Margin of Victory', icon: 'zap', value: '0.0', desc: 'How much winners win by', roast: 'Dominance quantified', variant: 'destructive' },
            ],
        },
        {
            icon: 'flame', title: 'Scoring Records', subtitle: 'The highs, the lows, and the "how did that happen?"', cols: 3,
            cards: [
                { title: 'Most Points in a Game', icon: 'trending-up', value: 0, desc: 'A single-week explosion', roast: 'They woke up and chose violence', badge: 'Hot', variant: 'primary' },
                { title: 'Fewest Points in a Game', icon: 'trending-down', value: 0, desc: 'Rock bottom achieved', roast: 'Did they even set a lineup?', variant: 'destructive' },
                { title: 'Most Points in a Loss', icon: 'skull', value: 0, desc: 'Pain in its purest form', roast: 'Wrong place, wrong time', variant: 'destructive' },
                { title: 'Fewest Points in a Win', icon: 'crown', value: 0, desc: 'A win is a win... right?', roast: 'Lucky to be alive', variant: 'secondary' },
                { title: 'Highest Combined Matchup', icon: 'zap', value: 0, desc: 'Both teams went off', roast: 'The shootout to end all shootouts', badge: 'Hot', variant: 'primary' },
                { title: 'Lowest Combined Matchup', icon: 'target', value: 0, desc: 'Defense wins championships?', roast: 'Nobody showed up that week', variant: 'default' },
            ],
        },
        {
            icon: 'zap', title: 'Point Margins', subtitle: 'Blowouts, nail-biters, and everything in between', cols: 3,
            cards: [
                { title: 'Largest Margin of Victory', icon: 'zap', value: 0, desc: 'Absolute domination', roast: "That's a blowout!", badge: 'Hot', variant: 'primary' },
                { title: 'Smallest Margin of Victory', icon: 'target', value: 0, desc: 'Nail-biter alert', roast: 'Heart attack material', variant: 'secondary' },
                { title: 'Games Decided by < 1 pt', icon: 'flame', value: 0, desc: 'Decimal point drama', roast: 'Monday night nightmares', variant: 'destructive' },
                { title: 'Avg Margin in Wins', icon: 'trending-up', value: '0.0', desc: 'How winners win', roast: 'Comfort zone, quantified', variant: 'primary' },
                { title: 'Avg Margin in Losses', icon: 'trending-down', value: '0.0', desc: 'How losers lose', roast: 'At least it was quick... usually', variant: 'destructive' },
                { title: 'Blowout Wins (20+ pts)', icon: 'zap', value: '0%', desc: 'Total annihilation rate', roast: 'Mercy rule should exist', variant: 'default' },
            ],
        },
        {
            icon: 'flame', title: 'The Streaks', subtitle: 'Every story has its highs and lows', cols: 2,
            cards: [
                { title: 'Longest Winning Streak', icon: 'trending-up', value: 12, desc: 'Unstoppable force', roast: 'Riding high!', badge: 'Hot', variant: 'secondary' },
                { title: 'Longest Losing Streak', icon: 'trending-down', value: 0, desc: 'Character-building moments', roast: 'We learn from these... right?', variant: 'destructive' },
            ],
        },
        {
            icon: 'trophy', title: 'Playoff Chaos', subtitle: 'When the stakes are highest, the stats get wildest', cols: 4,
            cards: [
                { title: 'Largest Championship Margin', icon: 'zap', value: 0, desc: 'Title game blowout', roast: 'Not even close', variant: 'primary' },
                { title: 'Closest Championship Game', icon: 'target', value: 0, desc: 'Championship cardiac arrest', roast: 'Somebody needed therapy after this', variant: 'secondary' },
                { title: 'Highest Scoring Championship', icon: 'trending-up', value: 0, desc: 'The best of the best went off', roast: 'A championship for the ages', badge: 'Hot', variant: 'primary' },
                { title: 'Lowest Scoring Championship', icon: 'trending-down', value: 0, desc: 'Not the finest hour', roast: 'We pretend this one didn\'t happen', variant: 'destructive' },
            ],
        },
        {
            icon: 'swords', title: 'Chaos & Luck Metrics', subtitle: "Sometimes it's not about skill, it's about the schedule", cols: 2,
            cards: [
                { title: 'Most Points Scored Against', icon: 'target', value: 0, desc: "Everyone's Super Bowl was playing you", roast: 'The defensive liability award', variant: 'destructive' },
                { title: 'Most Wins Below League Avg', icon: 'crown', value: 0, desc: 'Winning Ugly', roast: 'Style points: 0. Standings points: yes.', variant: 'secondary' },
            ],
        },
        {
            icon: 'star', title: 'Season Narrative Stats', subtitle: 'The stories the box score tells when nobody is watching', cols: 4,
            cards: [
                { title: 'Most Bench Points (Season)', icon: 'trending-down', value: 0, desc: 'Galaxy Brain Management', roast: 'Started the wrong guy. Every time.', variant: 'destructive' },
                { title: 'Most Single-Week Bench Points', icon: 'skull', value: 0, desc: 'Coaching Malpractice', roast: 'That one still hurts.', variant: 'destructive' },
                { title: 'Most Weeks Leading League', icon: 'crown', value: 0, desc: 'Regular Season Merchant', roast: 'Dominated Sundays. Questionable in January.', badge: 'Hot', variant: 'primary' },
                { title: 'Most Weeks in Last Place', icon: 'trending-down', value: 0, desc: 'Basement Residency Award', roast: 'Permanent address: 12th.', variant: 'destructive' },
            ],
        },
        {
            icon: 'skull', title: "That's Gotta Hurt", subtitle: 'The universe has a sick sense of humor', cols: 4,
            cards: [
                { title: 'Highest Score to Miss Playoffs', icon: 'skull', value: 0, desc: 'So close yet so far', roast: 'The fantasy football gods are cruel', variant: 'destructive' },
                { title: 'Lowest Score to Make Playoffs', icon: 'crown', value: 0, desc: 'Backed in on pure luck', roast: 'Failing upward, professionally', variant: 'secondary' },
                { title: 'Most Points Faced in a Season', icon: 'target', value: 0, desc: 'Schedule from hell', roast: 'The universe had a vendetta', variant: 'destructive' },
                { title: 'Best Season, No Playoff Wins', icon: 'skull', value: 0, desc: 'Paper Tiger', roast: 'Roared until it mattered.', variant: 'destructive' },
            ],
        },
        {
            icon: 'medal', title: 'Weekly Rankings', subtitle: 'Who owns the top and bottom of the leaderboard each week', cols: 2,
            cards: [
                { title: 'Most 1st Place Weekly Finishes', icon: 'crown', value: 0, desc: 'King of the week, every week', roast: 'Consistently on top', badge: 'Hot', variant: 'primary' },
                { title: 'Most Last Place Weekly Finishes', icon: 'skull', value: 0, desc: 'A permanent resident of the basement', roast: 'Somebody has to hold the floor down', variant: 'destructive' },
            ],
        },
    ];
}

export async function handlerServeLeagueStats(_: Request, res: Response) {
    const sections = getAllTimeStats();

    return res.render('pages/league-stats-page', {
        page: 'league-stats',
        title: 'Hall of Stats & Laughs',
        description: 'Bleed Blue Fantasy Football - League Statistics',
        sections,
    });
}
