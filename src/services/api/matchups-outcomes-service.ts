import { SelectMatchupOutcome, StrictInsertMatchupOutcome } from "../../db/schema.js";
import { selectLeagueMatchupOutcomes, insertMatchupOutcome } from "../../db/queries/matchup-outcomes.js";
import { buildLeagueHistoryIds } from "../../lib/helpers.js";

// we define the type here instead of zod file, because we don't need to parse already normalized data 
// that we fetched from the matchups table, that data has been validated before insertion
export type StrictMatchupOutcome = {
    leagueId: string;
    matchupId: number | null;
    week: number;
    rosterId: number;
    rosterOwnerId: string;
    season: string;
    team: string | null;
    pointsFor: string;
    pointsAgainst: string;
};

export async function buildAndInsertLeagueMatchupOutcomes() {
    const matchups = await buildLeagueMatchupOutcomes();
    const result = await insertLeagueMatchupOutcomes(matchups);
    return result;
}

export async function insertLeagueMatchupOutcomes(matchups: StrictInsertMatchupOutcome[]) {
    const successfulMatchups: SelectMatchupOutcome[] = [];
    const CHUNK_SIZE = 12; // 6 matchups a week * 2 (winner or loser or tie or bye)


    for (let i = 0; i < matchups.length; i += CHUNK_SIZE) {
        const chunk = matchups.slice(i, i + CHUNK_SIZE);
        const currentInsert = chunk.map(matchup => insertMatchupOutcome(matchup));
        const result = (await Promise.all(currentInsert)).flat();
        successfulMatchups.push(...result);
    }

    return successfulMatchups;
}

async function buildLeagueMatchupOutcomes() {
    const leagueIds = await buildLeagueHistoryIds();
    const matchupsPerLeague = await Promise.all(
        leagueIds.map(
            async leagueId => await selectLeagueMatchupOutcomes(leagueId)
        )
    );
    const result = matchupsPerLeague
        .map(
            matchups => normalizeMatchupOutcome(matchups)
        )
        .flat();

    return result;
}

function normalizeMatchupOutcome(matchups: StrictMatchupOutcome[]) {
    const normalizedMatchups: StrictInsertMatchupOutcome[] = [];

    for (const matchup of matchups) {
        const { matchupId } = matchup;
        const pointsFor = parseFloat(matchup.pointsFor);
        const pointsAgainst = parseFloat(matchup.pointsAgainst);


        if (matchupId === null) normalizedMatchups.push({ ...matchup, outcome: 'BYE' });
        else if (pointsFor === pointsAgainst) normalizedMatchups.push({ ...matchup, outcome: 'T' });
        else if (pointsFor > pointsAgainst) normalizedMatchups.push({ ...matchup, outcome: 'W' });
        else normalizedMatchups.push({ ...matchup, outcome: 'L' });
    }

    return normalizedMatchups;
}