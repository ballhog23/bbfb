import type { MatchupsPageParams } from "../../api/matchups-page.js";
import { groupAdjacentMatchups } from "../../lib/helpers.js";
import { selectAllLeaguesIdsAndSeasons } from "../../db/queries/leagues.js";
import { selectLeagueMatchupsByWeekWithoutByes } from "../../db/queries/matchups.js";
import { selectLeagueRosters } from "../../db/queries/rosters.js";
import { selectLeagueState } from "../../db/queries/league-state.js";
import { config } from "../../config.js";
import { SelectLeagueState } from "../../db/schema.js";
import { selectPlayoffMatchupsWithDetails } from "../../db/queries/playoffs.js";

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

export async function assembleMatchupsPageData(
    leagueIdParam: MatchupsPageParams["leagueId"],
    weekParam: MatchupsPageParams["week"]
) {
    const { matchupsView, leagueState } = await discernMatchupsView(weekParam);

    if (matchupsView === 'regular') {
        return assembleRegularSeasonMatchupsData(
            leagueState,
            leagueIdParam,
            weekParam
        );
    }

    return assemblePostSeasonMatchupsData(
        leagueState,
        leagueIdParam,
        weekParam
    );
}

async function assemblePostSeasonMatchupsData(
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

    const [allLeagues, playoffResults, rosters] = await Promise.all([
        selectAllLeaguesIdsAndSeasons(),
        selectPlayoffMatchupsWithDetails(currentLeagueId),
        selectLeagueRosters(currentLeagueId)
    ]);

    const currentLeague = allLeagues.find(l => l.leagueId === currentLeagueId);
    if (!currentLeague) throw new Error(`League ${currentLeagueId} not found`);

    const currentLeagueSeason = currentLeague.season;

    // Transform the flat query results into structured bracket data
    const matchups = transformPlayoffDataForView(playoffResults);

    return {
        allLeagues,
        currentLeagueId,
        currentLeagueSeason,
        currentWeek,
        matchups,
        rosters
    };
}

function transformPlayoffDataForView(queryResults: Awaited<ReturnType<typeof selectPlayoffMatchupsWithDetails>>) {
    const grouped: Record<string, any> = {};

    // Group by bracket type and round
    queryResults.forEach(row => {
        const key = `${row.bracketType}-${row.round}`;
        if (!grouped[key]) {
            grouped[key] = {
                bracketType: row.bracketType,
                round: row.round,
                matchups: []
            };
        }

        grouped[key].matchups.push({
            bracketMatchupId: row.bracketMatchupId,
            week: row.week,
            matchupId: row.matchupId,
            winnerId: row.winnerId,
            loserId: row.loserId,
            place: row.place,

            // Team 1
            t1: row.t1RosterId,
            team1: row.t1Team,
            owner1: row.t1Owner,
            points1: row.t1Points,
            startingRoster1: row.t1StartingRoster,
            benchRoster1: row.t1BenchRoster,

            // Team 2
            t2: row.t2RosterId,
            team2: row.t2Team,
            owner2: row.t2Owner,
            points2: row.t2Points,
            startingRoster2: row.t2StartingRoster,
            benchRoster2: row.t2BenchRoster,

            // Navigation
            t1FromWinner: row.t1FromWinner,
            t1FromLoser: row.t1FromLoser,
            t2FromWinner: row.t2FromWinner,
            t2FromLoser: row.t2FromLoser,
        });
    });

    // Separate into winners and losers brackets
    const winnersBracket: any[] = [];
    const losersBracket: any[] = [];

    Object.values(grouped).forEach((roundData: any) => {
        if (roundData.bracketType === 'winners_bracket') {
            winnersBracket.push(roundData);
        } else if (roundData.bracketType === 'losers_bracket') {
            losersBracket.push(roundData);
        }
    });

    // Sort by round (descending - round 3, 2, 1)
    winnersBracket.sort((a, b) => b.round - a.round);
    losersBracket.sort((a, b) => b.round - a.round);

    return {
        winnersBracket,
        losersBracket
    };
}

async function assembleRegularSeasonMatchupsData(
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