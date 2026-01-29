import type { MatchupsPageParams } from "../../api/matchups-page.js";
import { groupAdjacentMatchups } from "../../lib/helpers.js";
import { selectAllLeaguesIdsAndSeasons } from "../../db/queries/leagues.js";
import { selectLeagueMatchupsByWeekWithoutByes } from "../../db/queries/matchups.js";
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
    console.dir(rosters, { depth: null });
    console.dir(matchups, { depth: null });

    return {
        allLeagues,
        currentLeagueId,
        currentLeagueSeason,
        currentWeek,
        matchups,
        rosters
    };
}

export type AssembleMatchupsDataResponse =
    Awaited<ReturnType<typeof assembleMatchupsData>>;
