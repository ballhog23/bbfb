import { selectAllLeaguesIdsAndSeasons } from "../../db/queries/leagues.js";
import { BadRequestError, NotFoundError } from "../../lib/errors.js";
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

export async function getAllTimeStats() {
    const [
        theBigNumbers,
        scoringRecords,
        pointMargins,
        leaderboard,
        streaks,
        thatsGottaHurt
    ] =
        await Promise.all([
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
        thatsGottaHurt
    };
}

export async function getSeasonStats(leagueId: string) {
    if (!leagueId)
        throw new BadRequestError(`League ${leagueId} not found`);

    const [
        bigNumbers,
        scoringRecords,
        pointMargins,
        leaderboard,
        streaks,
        thatsGottaHurt
    ] =
        await Promise.all([
            selectSeasonBigNumbers(leagueId),
            selectSeasonScoringRecords(leagueId),
            selectSeasonPointMargins(leagueId),
            selectSeasonLeaderboard(leagueId),
            selectSeasonStreaks(leagueId),
            selectSeasonThatsGottaHurt(leagueId),
        ]);

    return {
        bigNumbers,
        scoringRecords,
        pointMargins,
        leaderboard,
        streaks,
        thatsGottaHurt
    };
}

export async function assembleLeagueStatsPageData(leagueId: string) {
    const allLeagues = await selectAllLeaguesIdsAndSeasons();
    const league = allLeagues.find(l => l.leagueId === leagueId);
    if (!league)
        throw new NotFoundError(`League ${leagueId} not found`);

    const season = league.season;

    return {
        stats: await getSeasonStats(leagueId),
        allLeagues,
        currentLeagueId: leagueId,
        currentSeason: season,
    };
}
