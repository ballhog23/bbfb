import { selectAllLeaguesIdsAndSeasons } from "../../db/queries/leagues.js";
import {
    selectTheBigNumbers,
    selectScoringRecords,
    selectPointMargins,
    selectLeaderboard,
    selectStreaks,
    selectThatsGottaHurt,
    selectSeasonBigNumbers,
    selectSeasonScoringRecords,
    selectSeasonPointMargins,
    selectSeasonLeaderboard,
    selectSeasonStreaks,
    selectSeasonThatsGottaHurt,
} from "../../db/queries/league-stats.js";

type StatsCard = {
    title: string;
    icon: string;
    value: string | number;
    desc: string;
    roast: string;
    variant: 'primary' | 'secondary' | 'destructive' | 'default';
};

type StatsSection = {
    icon: string;
    title: string;
    subtitle: string;
    cols: number;
    cards: StatsCard[];
};

export async function getAllTimeStats() {
    const [theBigNumbers, scoringRecords, pointMargins, leaderboard, streaks, thatsGottaHurt] =
        await Promise.all([
            selectTheBigNumbers(),
            selectScoringRecords(),
            selectPointMargins(),
            selectLeaderboard(),
            selectStreaks(),
            selectThatsGottaHurt(),
        ]);

    return [
        {
            icon: 'trophy', title: 'The Big Numbers', subtitle: 'The all-time ledger of fantasy dominance', cols: 3,
            cards: [
                { title: 'Total Points Scored', icon: 'target', value: Number(theBigNumbers.totalPts).toLocaleString(), desc: 'Every point, every season, every heartbreak', roast: 'The collective output of years of questionable decisions', variant: 'primary' },
                { title: 'Total Games Played', icon: 'trophy', value: theBigNumbers.totalGames, desc: 'Across every season in league history', roast: "That's a lot of Sundays sacrificed", variant: 'default' },
                { title: 'All-Time Avg PPG', icon: 'trending-up', value: Number(theBigNumbers.avgPts).toFixed(1), desc: 'The historical baseline for fantasy output', roast: 'The number that separates contenders from pretenders', variant: 'secondary' },
            ],
        },
        {
            icon: 'flame', title: 'Scoring Records', subtitle: 'The all-time highs, lows, and "how did that happen?" moments', cols: 3,
            cards: [
                { title: 'Most Points in a Game', icon: 'trending-up', value: scoringRecords.mostPtsValue, desc: `${scoringRecords.mostPtsTeamName} — Week ${scoringRecords.mostPtsWeek}, ${scoringRecords.mostPtsSeason}`, roast: 'They woke up and chose violence', variant: 'primary' },
                { title: 'Fewest Points in a Game', icon: 'trending-down', value: scoringRecords.fewestPtsValue, desc: `${scoringRecords.fewestPtsTeamName} — Week ${scoringRecords.fewestPtsWeek}, ${scoringRecords.fewestPtsSeason}`, roast: 'Did they even set a lineup?', variant: 'destructive' },
                { title: 'Fewest Points in a Win', icon: 'crown', value: scoringRecords.fewestPtsInWinValue, desc: `${scoringRecords.fewestPtsInWinTeamName} — Week ${scoringRecords.fewestPtsInWinWeek}, ${scoringRecords.fewestPtsInWinSeason}`, roast: 'Lucky to be alive', variant: 'secondary' },
                { title: 'Highest Combined Matchup', icon: 'zap', value: scoringRecords.highestCombinedValue, desc: `Week ${scoringRecords.highestCombinedWeek}, ${scoringRecords.highestCombinedSeason}`, roast: 'Both teams chose violence', variant: 'primary' },
                { title: 'Lowest Combined Matchup', icon: 'target', value: scoringRecords.lowestCombinedValue, desc: `Week ${scoringRecords.lowestCombinedWeek}, ${scoringRecords.lowestCombinedSeason}`, roast: 'Nobody showed up. Across all of history, this was the worst.', variant: 'default' },
            ],
        },
        {
            icon: 'zap', title: 'Point Margins', subtitle: 'Every blowout and nail-biter across league history', cols: 3,
            cards: [
                { title: 'Largest Margin of Victory', icon: 'zap', value: pointMargins.largestMarginValue, desc: `${pointMargins.largestMarginT1Name} vs ${pointMargins.largestMarginT2Name} — Week ${pointMargins.largestMarginWeek}, ${pointMargins.largestMarginSeason}`, roast: "That's a blowout for the ages", variant: 'primary' },
                { title: 'Smallest Margin of Victory', icon: 'target', value: pointMargins.smallestMarginValue, desc: `${pointMargins.smallestMarginT1Name} vs ${pointMargins.smallestMarginT2Name} — Week ${pointMargins.smallestMarginWeek}, ${pointMargins.smallestMarginSeason}`, roast: 'Monday night nightmares are made of margins like this', variant: 'secondary' },
                { title: 'Games Decided by < 1 pt', icon: 'flame', value: pointMargins.gamesUnder1pt, desc: 'Decimal point drama across all seasons', roast: 'Every one of these caused a Monday morning meltdown', variant: 'destructive' },
                { title: 'Avg Margin of Victory', icon: 'trending-up', value: pointMargins.avgMargin, desc: 'Average margin across all games in league history', roast: 'The comfort zone of victory, quantified for all time', variant: 'primary' },
                { title: 'Blowout Rate (20+ pts)', icon: 'zap', value: `${pointMargins.blowoutRate}%`, desc: 'All-time annihilation rate', roast: 'The percentage of games where mercy should have been shown', variant: 'default' },
            ],
        },
        {
            icon: 'flame', title: 'The Streaks', subtitle: 'The longest runs of glory and despair in league history', cols: 2,
            cards: [
                { title: 'Longest Winning Streak', icon: 'trending-up', value: `${streaks.winStreakLength}W`, desc: `${streaks.winStreakTeamName} — ${streaks.winStreakSeason}`, roast: 'Riding high across seasons', variant: 'secondary' },
                { title: 'Longest Losing Streak', icon: 'trending-down', value: `${streaks.lossStreakLength}L`, desc: `${streaks.lossStreakTeamName} — ${streaks.lossStreakSeason}`, roast: 'We learn from these... right?', variant: 'destructive' },
            ],
        },
        {
            icon: 'star', title: 'All-Time Leaderboard', subtitle: 'The legends atop the all-time mountain', cols: 4,
            cards: [
                { title: 'All-Time Points Leader', icon: 'crown', value: Number(leaderboard.ptsLeaderValue).toLocaleString(), desc: `${leaderboard.ptsLeaderName}`, roast: 'Volume over everything', variant: 'primary' },
                { title: 'Most All-Time Wins', icon: 'trophy', value: leaderboard.mostWinsValue, desc: `${leaderboard.mostWinsName}`, roast: 'Stacking Ws across eras', variant: 'secondary' },
                { title: 'Most All-Time Losses', icon: 'skull', value: leaderboard.mostLossesValue, desc: `${leaderboard.mostLossesName}`, roast: 'Longevity has its downsides', variant: 'destructive' },
                { title: 'Most Weekly Top Scores', icon: 'crown', value: leaderboard.mostTopScoresValue, desc: `${leaderboard.mostTopScoresName}`, roast: 'Consistency is king', variant: 'primary' },
            ],
        },
        {
            icon: 'skull', title: "That's Gotta Hurt", subtitle: 'The universe has had a sick sense of humor since day one', cols: 3,
            cards: [
                { title: 'Most Points in a Loss', icon: 'skull', value: thatsGottaHurt.mostPtsInLossValue, desc: `${thatsGottaHurt.mostPtsInLossTeamName} — Week ${thatsGottaHurt.mostPtsInLossWeek}, ${thatsGottaHurt.mostPtsInLossSeason}`, roast: 'Wrong place, wrong time', variant: 'destructive' },
                { title: 'Most Points Faced (All-Time)', icon: 'target', value: Number(thatsGottaHurt.mostPointsFacedValue).toLocaleString(), desc: `${thatsGottaHurt.mostPointsFacedName}`, roast: 'Schedule from hell, lifetime edition', variant: 'destructive' },
                { title: 'Most Weekly Last Places', icon: 'skull', value: thatsGottaHurt.mostLastPlacesValue, desc: `${thatsGottaHurt.mostLastPlacesName}`, roast: 'Somebody has to hold the floor down', variant: 'destructive' },
            ],
        },
    ];
}

export async function assembleAllTimeStatsPageData() {
    return { sections: await getAllTimeStats() };
}

async function getSeasonStats(leagueId: string, season: string): Promise<StatsSection[]> {
    const [bigNumbers, scoringRecords, pointMargins, leaderboard, streaks, thatsGottaHurt] =
        await Promise.all([
            selectSeasonBigNumbers(leagueId),
            selectSeasonScoringRecords(leagueId),
            selectSeasonPointMargins(leagueId),
            selectSeasonLeaderboard(leagueId),
            selectSeasonStreaks(leagueId),
            selectSeasonThatsGottaHurt(leagueId),
        ]);

    return [
        {
            icon: 'trophy', title: 'The Big Numbers', subtitle: `The ${season} season by the numbers`, cols: 3,
            cards: [
                {
                    title: 'Total Points Scored',
                    icon: 'target',
                    value: Number(bigNumbers.totalPts).toLocaleString(),
                    desc: `Every point scored in the ${season} season`,
                    roast: 'The collective output of one season of questionable decisions',
                    variant: 'primary'
                },
                { title: 'Games Played', icon: 'trophy', value: bigNumbers.totalGames, desc: `Total matchups this season`, roast: 'Another season in the books', variant: 'default' },
                { title: 'Season Avg PPG', icon: 'trending-up', value: Number(bigNumbers.avgPts).toFixed(1), desc: `The ${season} scoring baseline`, roast: 'Where did this season stack up?', variant: 'secondary' },
            ],
        },
        {
            icon: 'flame', title: 'Scoring Records', subtitle: `The highs and lows of the ${season} season`, cols: 3,
            cards: [
                { title: 'Most Points in a Game', icon: 'trending-up', value: scoringRecords.mostPtsValue, desc: `${scoringRecords.mostPtsTeamName} — Week ${scoringRecords.mostPtsWeek}`, roast: 'They woke up and chose violence', variant: 'primary' },
                { title: 'Fewest Points in a Game', icon: 'trending-down', value: scoringRecords.fewestPtsValue ?? 0, desc: `${scoringRecords.fewestPtsTeamName} — Week ${scoringRecords.fewestPtsWeek}`, roast: 'Did they even set a lineup?', variant: 'destructive' },
                { title: 'Fewest Points in a Win', icon: 'crown', value: scoringRecords.fewestPtsInWinValue ?? 0, desc: `${scoringRecords.fewestPtsInWinTeamName} — Week ${scoringRecords.fewestPtsInWinWeek}`, roast: 'Lucky to be alive', variant: 'secondary' },
                { title: 'Highest Combined Matchup', icon: 'zap', value: scoringRecords.highestCombinedValue, desc: `Week ${scoringRecords.highestCombinedWeek}`, roast: 'Both teams chose violence', variant: 'primary' },
                { title: 'Lowest Combined Matchup', icon: 'target', value: scoringRecords.lowestCombinedValue, desc: `Week ${scoringRecords.lowestCombinedWeek}`, roast: 'Nobody showed up that week', variant: 'default' },
            ],
        },
        {
            icon: 'zap', title: 'Point Margins', subtitle: `Blowouts and nail-biters of the ${season} season`, cols: 3,
            cards: [
                { title: 'Largest Margin of Victory', icon: 'zap', value: pointMargins.largestMarginValue, desc: `${pointMargins.largestMarginT1Name} vs ${pointMargins.largestMarginT2Name} — Week ${pointMargins.largestMarginWeek}`, roast: "That's a blowout!", variant: 'primary' },
                { title: 'Smallest Margin of Victory', icon: 'target', value: pointMargins.smallestMarginValue, desc: `${pointMargins.smallestMarginT1Name} vs ${pointMargins.smallestMarginT2Name} — Week ${pointMargins.smallestMarginWeek}`, roast: 'Heart attack material', variant: 'secondary' },
                { title: 'Games Decided by < 1 pt', icon: 'flame', value: pointMargins.gamesUnder1pt, desc: `Decimal point drama this season`, roast: 'Monday night nightmares', variant: 'destructive' },
                { title: 'Avg Margin of Victory', icon: 'trending-up', value: pointMargins.avgMargin, desc: `Average margin this season`, roast: 'Comfort zone, quantified', variant: 'primary' },
                { title: 'Blowout Rate (20+ pts)', icon: 'zap', value: `${pointMargins.blowoutRate}%`, desc: `Season annihilation rate`, roast: 'Mercy rule should exist', variant: 'default' },
            ],
        },
        {
            icon: 'flame', title: 'The Streaks', subtitle: `The longest runs of the ${season} season`, cols: 2,
            cards: [
                { title: 'Longest Winning Streak', icon: 'trending-up', value: `${streaks.winStreakLength}W`, desc: `${streaks.winStreakTeamName}`, roast: 'Riding high!', variant: 'secondary' },
                { title: 'Longest Losing Streak', icon: 'trending-down', value: `${streaks.lossStreakLength}L`, desc: `${streaks.lossStreakTeamName}`, roast: 'Character-building moments', variant: 'destructive' },
            ],
        },
        {
            icon: 'star', title: 'Season Leaderboard', subtitle: `Who ran the ${season} season`, cols: 4,
            cards: [
                { title: 'Season Points Leader', icon: 'crown', value: Number(leaderboard.ptsLeaderValue).toLocaleString(), desc: `${leaderboard.ptsLeaderName}`, roast: 'Volume over everything this season', variant: 'primary' },
                { title: 'Winningest Manager', icon: 'trophy', value: leaderboard.mostWinsValue, desc: `${leaderboard.mostWinsName}`, roast: 'They owned this season', variant: 'secondary' },
                { title: 'Most Losses', icon: 'skull', value: leaderboard.mostLossesValue, desc: `${leaderboard.mostLossesName}`, roast: 'Better luck next year', variant: 'destructive' },
                { title: 'Most Weekly Top Scores', icon: 'crown', value: thatsGottaHurt.mostTopScoresValue, desc: `${thatsGottaHurt.mostTopScoresName}`, roast: 'King of the week', variant: 'primary' },
            ],
        },
        {
            icon: 'skull', title: "That's Gotta Hurt", subtitle: `The ${season} season was not kind to everyone`, cols: 3,
            cards: [
                { title: 'Most Points in a Loss', icon: 'skull', value: thatsGottaHurt.mostPtsInLossValue ?? 0, desc: `${thatsGottaHurt.mostPtsInLossTeamName} — Week ${thatsGottaHurt.mostPtsInLossWeek}`, roast: 'Wrong place, wrong time', variant: 'destructive' },
                { title: 'Most Points Faced', icon: 'target', value: Number(thatsGottaHurt.mostPointsFacedValue).toLocaleString(), desc: `${thatsGottaHurt.mostPointsFacedName}`, roast: 'The universe had a vendetta this season', variant: 'destructive' },
                { title: 'Most Weekly Last Places', icon: 'skull', value: thatsGottaHurt.mostLastPlacesValue, desc: `${thatsGottaHurt.mostLastPlacesName}`, roast: 'Somebody had to hold the floor down', variant: 'destructive' },
            ],
        },
    ];
}

export async function assembleLeagueStatsPageData(leagueId: string) {
    const allLeagues = await selectAllLeaguesIdsAndSeasons();
    const league = allLeagues.find(l => l.leagueId === leagueId);
    const season = league?.season ?? 'Unknown';

    return {
        sections: await getSeasonStats(leagueId, season),
        allLeagues,
        currentLeagueId: leagueId,
        currentSeason: season,
    };
}
