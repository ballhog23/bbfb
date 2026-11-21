import { selectAllLeaguesIdsAndSeasons } from "../../db/queries/leagues.js";
import { BadRequestError, NotFoundError } from "../../lib/errors.js";
import { selectTheBigNumbers, selectScoringRecords, selectPointMargins, selectLeaderboard, selectStreaks, selectThatsGottaHurt, selectSeasonBigNumbers, selectSeasonScoringRecords, selectSeasonPointMargins, selectSeasonLeaderboard, selectSeasonStreaks, selectSeasonThatsGottaHurt, } from "../../db/queries/league-stats.js";
export async function getAllTimeStats() {
    const [theBigNumbers, scoringRecords, pointMargins, leaderboard, streaks, thatsGottaHurt,] = await Promise.all([
        selectTheBigNumbers(),
        selectScoringRecords(),
        selectPointMargins(),
        selectLeaderboard(),
        selectStreaks(),
        selectThatsGottaHurt(),
    ]);
    return {
        bigNumbers: theBigNumbers,
        scoringRecords,
        pointMargins,
        leaderboard,
        streaks,
        thatsGottaHurt,
    };
}
export async function getSeasonStats(leagueId) {
    if (!leagueId)
        throw new BadRequestError(`League ${leagueId} not found`);
    const [bigNumbers, scoringRecords, pointMargins, leaderboard, streaks, thatsGottaHurt,] = await Promise.all([
        selectSeasonBigNumbers(leagueId),
        selectSeasonScoringRecords(leagueId),
        selectSeasonPointMargins(leagueId),
        selectSeasonLeaderboard(leagueId),
        selectSeasonStreaks(leagueId),
        selectSeasonThatsGottaHurt(leagueId),
    ]);
    // Every section but bigNumbers is driven by a subquery that yields no row
    // until the season has a completed matchup, so drizzle hands back undefined.
    const sections = [
        scoringRecords,
        pointMargins,
        leaderboard,
        streaks,
        thatsGottaHurt,
    ];
    const hasSeasonData = Number(bigNumbers?.totalGames ?? 0) > 0 &&
        sections.every((section) => section != null);
    if (!hasSeasonData)
        return null;
    return {
        bigNumbers,
        scoringRecords,
        pointMargins,
        leaderboard,
        streaks,
        thatsGottaHurt,
    };
}
export async function assembleLeagueStatsPageData(rawLeagueId) {
    const allLeagues = await selectAllLeaguesIdsAndSeasons();
    const league = allLeagues.find((l) => l.leagueId === rawLeagueId);
    if (!league)
        throw new NotFoundError(`League ${rawLeagueId} not found`);
    const { leagueId, season } = league;
    return {
        stats: await getSeasonStats(leagueId),
        allLeagues,
        currentLeagueId: leagueId,
        currentSeason: season,
    };
}
