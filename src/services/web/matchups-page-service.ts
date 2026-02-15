import type { MatchupsPageParams } from "../../api/matchups-page.js";
import { groupAdjacentMatchups } from "../../lib/helpers.js";
import { selectAllLeaguesIdsAndSeasons } from "../../db/queries/leagues.js";
import { selectLeagueMatchupsByWeekWithoutByes } from "../../db/queries/matchups.js";
import { selectLeagueRosters } from "../../db/queries/rosters.js";
import { selectLeagueState } from "../../db/queries/league-state.js";
import { config } from "../../config.js";
import { SelectLeagueState } from "../../db/schema.js";
import { BadRequestError, NotFoundError } from "../../lib/errors.js";
import { selectPlayoffMatchupsWithDetails } from "../../db/queries/playoffs.js";

// handles excluding the newest league from the dropdown when env vars point ahead of league state
async function getLeaguesForDropdown(leagueState: SelectLeagueState) {
    const allLeagues = await selectAllLeaguesIdsAndSeasons();
    const envUpdatedAhead = !leagueState.isLeagueActive && leagueState.season !== config.league.season;
    return envUpdatedAhead
        ? allLeagues.filter(l => l.leagueId !== config.league.id)
        : allLeagues;
}

export async function assembleMatchupsPageData(
    leagueIdParam: MatchupsPageParams["leagueId"],
    weekParam: MatchupsPageParams["week"]
) {
    const leagueState = await selectLeagueState();
    if (!leagueState) throw new NotFoundError("League state not found");

    const currentLeagueId = leagueIdParam ?? config.league.id;
    const isCurrentLeague = currentLeagueId === config.league.id;
    const parsedWeek = weekParam ? parseInt(weekParam, 10) : NaN;
    const weekNanCheck = isNaN(parsedWeek);

    if (weekNanCheck || !Number.isInteger(parsedWeek) || parsedWeek <= 0 || parsedWeek > 17)
        throw new BadRequestError('You must provide a valid week number. Ranging 1-17');

    const requestedWeek = weekNanCheck ? leagueState.displayWeek : parsedWeek;

    // Current league: browse regular season weeks (1-14) freely,
    // but clamp playoff weeks (15+) to displayWeek
    const effectiveWeek = isCurrentLeague && requestedWeek >= 15
        ? Math.min(requestedWeek, leagueState.displayWeek)
        : requestedWeek;

    const matchupsView = effectiveWeek < 15 ? 'regular' : 'post';

    if (matchupsView === 'regular') {
        return assembleRegularSeasonMatchupsData(
            leagueState,
            currentLeagueId,
            isCurrentLeague,
            effectiveWeek
        );
    }

    return assemblePostSeasonMatchupsData(
        leagueState,
        currentLeagueId,
        isCurrentLeague,
        effectiveWeek
    );
}

async function assemblePostSeasonMatchupsData(
    leagueState: SelectLeagueState,
    currentLeagueId: string,
    isCurrentLeague: boolean,
    currentWeek: number
) {
    const [allLeagues, playoffResults, rosters] = await Promise.all([
        getLeaguesForDropdown(leagueState),
        selectPlayoffMatchupsWithDetails(currentLeagueId),
        selectLeagueRosters(currentLeagueId)
    ]);

    const currentLeague = allLeagues.find(l => l.leagueId === currentLeagueId);
    if (!currentLeague)
        throw new NotFoundError(`League ${currentLeagueId} not found`);

    const currentLeagueSeason = currentLeague.season;
    const matchups = transformPlayoffDataForView(playoffResults);

    return {
        allLeagues,
        currentLeagueId,
        currentLeagueSeason,
        currentWeek,
        isCurrentLeague,
        isPostSeason: leagueState.displayWeek >= 15,
        matchups,
        rosters
    };
}

type PlayoffMatchupResults = Awaited<ReturnType<typeof selectPlayoffMatchupsWithDetails>>;
type PlayoffMatchupRow = PlayoffMatchupResults[number];
type PlayoffRound = {
    bracketType: string;
    round: number;
    matchups: PlayoffMatchupRow[];
};

function transformPlayoffDataForView(queryResults: PlayoffMatchupResults) {
    const grouped = Object.groupBy(queryResults, row => `${row.bracketType}-${row.round}`);

    const winnersBracket: PlayoffRound[] = [];
    const losersBracket: PlayoffRound[] = [];
    for (const matchups of Object.values(grouped)) {
        if (!matchups) continue;
        const roundData: PlayoffRound = {
            bracketType: matchups[0].bracketType,
            round: matchups[0].round,
            matchups
        };
        if (roundData.bracketType === 'winners_bracket') {
            winnersBracket.push(roundData);
        } else if (roundData.bracketType === 'losers_bracket') {
            losersBracket.push(roundData);
        }
    }

    // Sort by round (descending - round 3, 2, 1)
    winnersBracket.sort((a, b) => b.round - a.round);
    losersBracket.sort((a, b) => b.round - a.round);

    return { winnersBracket, losersBracket };
}

async function assembleRegularSeasonMatchupsData(
    leagueState: SelectLeagueState,
    currentLeagueId: string,
    isCurrentLeague: boolean,
    currentWeek: number
) {
    const [allLeagues, orderedMatchups, rosters] = await Promise.all([
        getLeaguesForDropdown(leagueState),
        selectLeagueMatchupsByWeekWithoutByes(currentLeagueId, currentWeek),
        selectLeagueRosters(currentLeagueId)
    ]);

    const currentLeague = allLeagues.find(l => l.leagueId === currentLeagueId);
    if (!currentLeague)
        throw new NotFoundError(`League ${currentLeagueId} not found`);

    const currentLeagueSeason = currentLeague.season;
    const matchups = groupAdjacentMatchups(orderedMatchups);

    return {
        allLeagues,
        currentLeagueId,
        currentLeagueSeason,
        currentWeek,
        isCurrentLeague,
        isPostSeason: leagueState.displayWeek >= 15,
        matchups,
        rosters
    };
}