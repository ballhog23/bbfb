import { NotFoundError } from "../../lib/errors.js";
import { buildCompletedLeaguesIds } from "../../lib/helpers.js";
import {
    selectChampionInfo, type ChampionInfo,
    selectDistinctChamps,
    selectWinningestChamp, type WinningestChamp,
    selectHighestScoringChampionshipGame, type HighestScoringChampionshipGame
} from "../../db/queries/champions-hall.js";

export type ChampionData = ChampionInfo & {
    quote: string;
};

export type ChampionsHallStats = {
    totalChampionships: number;
    uniqueChampions: number;
    dynastyLeader: WinningestChamp;
    recordFinalsScore: HighestScoringChampionshipGame;
};

const championQuotes = [
    'Twisters and titties, LFG',
    'We should put an * on this one...',
    'If we added espn support, you would see that this is really #3',
    'If we added espn support, you would see that this is really #2',
    'I like turtles'
];

// if we have any weird camel case teams in the future, which we won,t we can add here
// otherwise we can figure out another strategy to eliminate long strings on the frontend
const camelCaseTeams = new Set(['JerrysGloryHole.']);

// fixes long string team names who are camel-cased
const formatTeamName = (name: string) =>
    camelCaseTeams.has(name) ? name.replace(/([a-z])([A-Z])/g, '$1 $2') : name;

export async function assembleChampionsHallPageData() {
    const leagueIds = await buildCompletedLeaguesIds();
    if (leagueIds.length === 0)
        throw new NotFoundError('Could not retrieve League Ids.');

    const [rawChampions, distinctResult, dynastyLeader, recordFinalsScore] = await Promise.all([
        Promise.all(leagueIds.map(selectChampionInfo)),
        selectDistinctChamps(),
        selectWinningestChamp(),
        selectHighestScoringChampionshipGame()
    ]);

    const champions: ChampionData[] = rawChampions.map((champ, i) => ({
        ...champ,
        team: champ.team ? formatTeamName(champ.team) : champ.name,
        quote: championQuotes[i] ?? ''
    }));

    const stats: ChampionsHallStats = {
        totalChampionships: leagueIds.length,
        uniqueChampions: distinctResult.count,
        dynastyLeader,
        recordFinalsScore,
    };

    return { champions, stats };
}
