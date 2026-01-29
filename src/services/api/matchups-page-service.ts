import type { MatchupsPageParams } from "../../api/matchups-page.js";
import { groupAdjacentMatchups } from "../../lib/helpers.js";
import { selectAllLeaguesIdsAndSeasons } from "../../db/queries/leagues.js";
import { selectLeagueMatchupsByWeekWithoutByes } from "../../db/queries/matchups.js";
import { selectLeagueRosters } from "../../db/queries/rosters.js";
import { selectLeagueState } from "../../db/queries/league-state.js";
import { config } from "../../config.js";
import { SelectLeagueState } from "../../db/schema.js";
import { selectPlayoffMatchupsPerSeason } from "../../db/queries/playoffs.js";

export async function discernMatchupsView(weekParam: MatchupsPageParams["week"]) {
    const leagueState = await selectLeagueState();
    if (!leagueState) throw new Error("League state not found");

    // Parse the week from string param
    const parsedWeek = weekParam ? parseInt(weekParam, 10) : NaN;

    // If parse fails, fallback to leagueState.displayWeek
    const weekToCheck = isNaN(parsedWeek) ? leagueState.displayWeek : parsedWeek;

    return {
        matchupsView: weekToCheck < 15 ? 'regular' : 'post',
        leagueState
    };
}

export async function assemblePostSeasonMatchupsData(
    leagueState: SelectLeagueState,
    leagueIdParam: MatchupsPageParams["leagueId"],
    weekParam: MatchupsPageParams["week"]
) {
    const currentLeagueId = leagueIdParam ?? config.league.id;
    const requestedWeekParam = parseInt(weekParam);
    const defaultWeek = isNaN(requestedWeekParam) ? leagueState.displayWeek : requestedWeekParam;
    // clamping week to be between 15-17
    const clampedWeek = Math.min(17, Math.max(15, defaultWeek));
    // never allow requested week to escape weeks 15-17, if its week 16 and someone requests 17, the min is taken
    // and the query runs properly
    const currentWeek = Math.min(clampedWeek, leagueState.displayWeek);

    const [allLeagues, brackets, rosters] = await Promise.all([
        selectAllLeaguesIdsAndSeasons(),
        selectPlayoffMatchupsPerSeason(currentLeagueId),
        selectLeagueRosters(currentLeagueId)
    ]);

    const currentLeague = allLeagues.find(l => l.leagueId === currentLeagueId);
    if (!currentLeague)
        throw new Error(`League ${currentLeagueId} not found`);

    const currentLeagueSeason = currentLeague.season;
    const winnersBracket = brackets.filter(matchup => matchup.bracketType === 'winners_bracket');
    const losersBracket = brackets.filter(matchup => matchup.bracketType === 'losers_bracket');
    const matchups = { winnersBracket, losersBracket };

    return {
        allLeagues,
        currentLeagueId,
        currentLeagueSeason,
        currentWeek,
        matchups,
        rosters
    };
}

export async function assembleRegularSeasonMatchupsData(
    leagueState: SelectLeagueState,
    leagueIdParam: MatchupsPageParams["leagueId"],
    weekParam: MatchupsPageParams["week"]
) {
    const currentLeagueId = leagueIdParam ?? config.league.id;
    const parsedWeek = parseInt(weekParam);
    const currentWeek = isNaN(parsedWeek) ? leagueState.displayWeek : parsedWeek;

    const [allLeagues, orderedMatchups, rosters] = await Promise.all([
        selectAllLeaguesIdsAndSeasons(),
        selectLeagueMatchupsByWeekWithoutByes(currentLeagueId, currentWeek),
        selectLeagueRosters(currentLeagueId)
    ]);

    const currentLeague = allLeagues.find(l => l.leagueId === currentLeagueId);
    if (!currentLeague)
        throw new Error(`League ${currentLeagueId} not found`);

    const currentLeagueSeason = currentLeague.season;

    const matchups = groupAdjacentMatchups(orderedMatchups);

    return {
        allLeagues,
        currentLeagueId,
        currentLeagueSeason,
        currentWeek,
        matchups,
        rosters
    };
}

// export async function assembleMatchupsData(leagueIdParam: MatchupsPageParams["leagueId"], weekParam: MatchupsPageParams["week"]) {
//     const viewState = discernMatchupsView();
//     const { matchupsView, leagueState } = viewState;

//     if (matchupsView === 'regular') {
//         // render regular season view
//     } else {
//         // render postseason view
//     }

// }

// export type AssembleMatchupsDataResponse =
//     Awaited<ReturnType<typeof assembleMatchupsData>>;