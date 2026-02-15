import { NotFoundError } from "../../lib/errors.js";
import { buildCompletedLeaguesIds } from "../../lib/helpers.js";
import {
    selectSackoInfo, type SackoInfo,
    selectDistinctSackos,
    selectMostSackos, type MostSackos,
    selectLowestScoringFinalGame, type LowestScoringFinalGame
} from "../../db/queries/sacko-hall.js";

export type SackoData = SackoInfo & {
    quote: string;
};

export type SackoHallStats = {
    totalSackos: number;
    uniqueLosers: number;
    sackoKing: MostSackos;
    lowestFinalsScore: LowestScoringFinalGame;
};

const sackoQuotes = [
    'At least I have my personality.',
    'My team had more injuries than points...',
    'I was drunk...',
    'I blame the bye weeks. All of them...',
    'They said fantasy football was fun. They lied...'
];

// if we have any weird camel case teams in the future, which we won,t we can add here
// otherwise we can figure out another strategy to eliminate long strings on the frontend
const camelCaseTeams = new Set(['JerrysGloryHole.']);

// fixes long string team names who are camel-cased
const formatTeamName = (name: string) =>
    camelCaseTeams.has(name) ? name.replace(/([a-z])([A-Z])/g, '$1 $2') : name;

export async function assembleSackoHallPageData() {
    const leagueIds = await buildCompletedLeaguesIds();
    if (leagueIds.length === 0)
        throw new NotFoundError('Could not retrieve League Ids.');

    const [rawSackos, distinctResult, sackoKing, lowestFinalsScore] = await Promise.all([
        Promise.all(leagueIds.map(selectSackoInfo)),
        selectDistinctSackos(),
        selectMostSackos(),
        selectLowestScoringFinalGame()
    ]);

    const sackos: SackoData[] = rawSackos.map((sacko, i) => ({
        ...sacko,
        team: sacko.team ? formatTeamName(sacko.team) : sacko.name,
        quote: sackoQuotes[i] ?? ''
    }));

    const stats: SackoHallStats = {
        totalSackos: leagueIds.length,
        uniqueLosers: distinctResult.count,
        sackoKing,
        lowestFinalsScore,
    };

    return { sackos, stats };
}
