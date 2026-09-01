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
export async function getLeaguesForDropdown(leagueState: SelectLeagueState) {
    const allLeagues = await selectAllLeaguesIdsAndSeasons();
    const envUpdatedAhead =
        !leagueState.isLeagueActive &&
        leagueState.season !== config.league.season;
    return envUpdatedAhead
        ? allLeagues.filter((l) => l.leagueId !== config.league.id)
        : allLeagues;
}

type LeagueOptions = Awaited<ReturnType<typeof getLeaguesForDropdown>>;

type MatchupsPageContext = {
    leagueState: SelectLeagueState;
    allLeagues: LeagueOptions;
    leagueId: string;
    season: string;
    isCurrentLeague: boolean;
    week: number;
};

export async function assembleMatchupsPageData(
    rawLeagueId: MatchupsPageParams["leagueId"],
    weekParam: MatchupsPageParams["week"]
) {
    const leagueState = await selectLeagueState();
    if (!leagueState) throw new NotFoundError("League state not found");

    const allLeagues = await getLeaguesForDropdown(leagueState);
    const league = allLeagues.find(
        (l) => l.leagueId === (rawLeagueId ?? config.league.id)
    );

    if (!league) throw new NotFoundError("League not found");

    const { leagueId, season } = league;
    const isCurrentLeague = leagueId === config.league.id;
    const requestedWeek = parseInt(weekParam, 10);

    if (
        !Number.isInteger(requestedWeek) ||
        requestedWeek <= 0 ||
        requestedWeek > 17
    )
        throw new BadRequestError(
            "You must provide a valid week number. Ranging 1-17"
        );

    // Current league: browse regular season weeks (1-14) freely,
    // but clamp playoff weeks (15+) to displayWeek
    const effectiveWeek =
        isCurrentLeague && requestedWeek >= 15
            ? Math.min(requestedWeek, leagueState.displayWeek)
            : requestedWeek;

    const matchupsView = effectiveWeek < 15 ? "regular" : "post";

    const context: MatchupsPageContext = {
        leagueState,
        allLeagues,
        leagueId,
        season,
        isCurrentLeague,
        week: effectiveWeek,
    };

    return matchupsView === "regular"
        ? assembleRegularSeasonMatchupsData(context)
        : assemblePostSeasonMatchupsData(context);
}

async function assemblePostSeasonMatchupsData(context: MatchupsPageContext) {
    const { leagueState, allLeagues, leagueId, season, isCurrentLeague, week } =
        context;

    const [playoffResults, rosters] = await Promise.all([
        selectPlayoffMatchupsWithDetails(leagueId),
        selectLeagueRosters(leagueId),
    ]);

    const matchups = transformPlayoffDataForView(playoffResults);

    return {
        allLeagues,
        currentLeagueId: leagueId,
        currentLeagueSeason: season,
        currentWeek: week,
        isCurrentLeague,
        isPostSeason: leagueState.displayWeek >= 15,
        matchups,
        rosters,
    };
}

type PlayoffMatchupResults = Awaited<
    ReturnType<typeof selectPlayoffMatchupsWithDetails>
>;
type PlayoffMatchupRow = PlayoffMatchupResults[number];
type PlayoffRound = {
    bracketType: string;
    round: number;
    matchups: PlayoffMatchupRow[];
};

function transformPlayoffDataForView(queryResults: PlayoffMatchupResults) {
    const grouped = Object.groupBy(
        queryResults,
        (row) => `${row.bracketType}-${row.round}`
    );

    const winnersBracket: PlayoffRound[] = [];
    const losersBracket: PlayoffRound[] = [];
    for (const matchups of Object.values(grouped)) {
        if (!matchups) continue;
        const roundData: PlayoffRound = {
            bracketType: matchups[0].bracketType,
            round: matchups[0].round,
            matchups,
        };
        if (roundData.bracketType === "winners_bracket") {
            winnersBracket.push(roundData);
        } else if (roundData.bracketType === "losers_bracket") {
            losersBracket.push(roundData);
        }
    }

    // Sort by round (descending - round 3, 2, 1)
    winnersBracket.sort((a, b) => b.round - a.round);
    losersBracket.sort((a, b) => b.round - a.round);

    return { winnersBracket, losersBracket };
}

async function assembleRegularSeasonMatchupsData(context: MatchupsPageContext) {
    const { leagueState, allLeagues, leagueId, season, isCurrentLeague, week } =
        context;

    const [orderedMatchups, rosters] = await Promise.all([
        selectLeagueMatchupsByWeekWithoutByes(leagueId, week),
        selectLeagueRosters(leagueId),
    ]);

    const matchups = groupAdjacentMatchups(orderedMatchups);

    return {
        allLeagues,
        currentLeagueId: leagueId,
        currentLeagueSeason: season,
        currentWeek: week,
        isCurrentLeague,
        isPostSeason: leagueState.displayWeek >= 15,
        matchups,
        rosters,
    };
}
