import type { MatchupsPageParams } from "../../api/matchups-page.js";
import { groupAdjacentMatchups } from "../../lib/helpers.js";
import { selectAllLeaguesIdsAndSeasons } from "../../db/queries/leagues.js";
import { selectLeagueMatchupsByWeekWithoutByes } from "../../db/queries/matchups.js";
import { selectLeagueRosters } from "../../db/queries/rosters.js";
import { selectLeagueState } from "../../db/queries/league-state.js";
import { config } from "../../config.js";
import { SelectLeagueState, SelectPlayoffMatchup } from "../../db/schema.js";
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

    // clamp week to 15-17
    const clampedWeek = Math.min(17, Math.max(15, defaultWeek));
    const currentWeek = Math.min(clampedWeek, leagueState.displayWeek);

    const [allLeagues, brackets, rosters] = await Promise.all([
        selectAllLeaguesIdsAndSeasons(),
        selectPlayoffMatchupsPerSeason(currentLeagueId),
        selectLeagueRosters(currentLeagueId)
    ]);

    const currentLeague = allLeagues.find(l => l.leagueId === currentLeagueId);
    if (!currentLeague) throw new Error(`League ${currentLeagueId} not found`);

    const currentLeagueSeason = currentLeague.season;

    // group brackets by type & rounds
    const winnersBracket = groupPlayoffMatchupsByRound(
        brackets.filter(m => m.bracketType === 'winners_bracket')
    );
    const losersBracket = groupPlayoffMatchupsByRound(
        brackets.filter(m => m.bracketType === 'losers_bracket')
    );

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

function groupPlayoffMatchupsByRound(matchups: SelectPlayoffMatchup[]) {
    const roundsMap: Record<number, SelectPlayoffMatchup[]> = {};

    matchups.forEach(matchup => {
        if (!roundsMap[matchup.round]) roundsMap[matchup.round] = [];
        roundsMap[matchup.round].push(matchup);
    });

    const rounds = Object.keys(roundsMap)
        .map(r => ({
            round: parseInt(r),
            matchups: roundsMap[parseInt(r)]
        }))
        .sort((a, b) => a.round - b.round);

    return rounds;
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


