import type { MatchupsPageParams } from "../../api/matchups-page.js";
import { groupAdjacentMatchups } from "../../lib/helpers.js";
import { selectAllLeaguesIdsAndSeasons } from "../../db/queries/leagues.js";
import { selectLeagueMatchupsByWeekWithoutByes } from "../../db/queries/matchups.js";
import { selectLeagueRegularSeasonStats } from "../../db/queries/matchup-outcomes.js";
import { selectLeagueRosters } from "../../db/queries/rosters.js";
import { selectLeagueState } from "../../db/queries/league-state.js";
import { config } from "../../config.js";

export async function assembleMatchupsData(leagueIdParam: MatchupsPageParams["leagueId"], weekParam: MatchupsPageParams["week"]) {
    const leagueState = await selectLeagueState();
    if (!leagueState)
        throw new Error("League state not found");

    const currentLeagueId = leagueIdParam ?? config.league.id;
    const parsedWeek = parseInt(weekParam);
    const currentWeek = isNaN(parsedWeek) ? leagueState.displayWeek : parsedWeek;

    const [allLeagues, orderedMatchups, regularSeasonStandings, rosters] = await Promise.all([
        selectAllLeaguesIdsAndSeasons(),
        selectLeagueMatchupsByWeekWithoutByes(currentLeagueId, currentWeek),
        selectLeagueRegularSeasonStats(currentLeagueId),
        selectLeagueRosters(currentLeagueId)
    ]);

    const currentLeague = allLeagues.find(l => l.leagueId === currentLeagueId);
    if (!currentLeague)
        throw new Error(`League ${currentLeagueId} not found`);

    const currentLeagueSeason = currentLeague.season;

    const matchups = groupAdjacentMatchups(orderedMatchups);

    const rosterByUserId = new Map(rosters.map(r => [r.userId, r]));
    const standingsRows = regularSeasonStandings.map(row => ({
        ...row,
        roster: (rosterByUserId.get(row.userId)?.players ?? []).sort(
            (a, b) => Number(b.starter) - Number(a.starter)
        )
    }));

    return {
        allLeagues,
        currentLeagueId,
        currentLeagueSeason,
        currentWeek,
        matchups,
        standingsRows
    };
}

export type AssembleMatchupsDataResponse =
    Awaited<ReturnType<typeof assembleMatchupsData>>;
