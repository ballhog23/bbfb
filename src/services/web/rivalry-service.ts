import { NotFoundError } from "../../lib/errors.js";
import {
    selectAllSleeperUsersData, getHeadToHeadMatchupData,
    type HeadToHeadData
} from "../../db/queries/sleeper-users.js";
import type { RilvaryPageParams } from "../../api/rivalry-page.js";

export async function buildDropDownTeams() {
    const teams = await selectAllSleeperUsersData();
    if (teams.length === 0)
        throw new NotFoundError('No teams found to populate dropdown selections');

    return teams;
}

export async function assembleRivalryPageData(
    challenger: RilvaryPageParams["userId1"],
    opponent: RilvaryPageParams["userId2"]
) {
    const headToHeadData = await getHeadToHeadMatchupData(challenger, opponent);
    const matchupData = assembleMatchupData(headToHeadData);
    return matchupData;
}

export function assembleMatchupData(matchupData: HeadToHeadData) {
    if (matchupData.length === 0) return null;

    const partialStats = matchupData.reduce((acc, game) => {
        const parsedChallengerPoints = parseFloat(game.challengerPoints);
        const parsedOpponentPoints = parseFloat(game.opponentPoints);

        // total points scored per user
        acc.challengerTotal += parsedChallengerPoints;
        acc.opponentTotal += parsedOpponentPoints;

        // Win ratio
        if (game.challengerOutcome === 'W') acc.challengerWins++;
        else if (game.challengerOutcome === 'L') acc.opponentWins++;

        // hiscores
        if (parsedChallengerPoints > acc.challengerHiscore)
            acc.challengerHiscore = parsedChallengerPoints;

        if (parsedOpponentPoints > acc.opponentHiscore)
            acc.opponentHiscore = parsedOpponentPoints;

        // low scores
        if (parsedChallengerPoints < acc.challengerLowScore || acc.challengerLowScore === 0)
            acc.challengerLowScore = parsedChallengerPoints;

        if (parsedOpponentPoints < acc.opponentLowScore || acc.opponentLowScore === 0)
            acc.opponentLowScore = parsedOpponentPoints;

        // closest game
        const gamePointDiff = Math.abs(parsedChallengerPoints - parsedOpponentPoints);
        if (gamePointDiff < acc.closestGame || acc.closestGame === 0)
            acc.closestGame = gamePointDiff;

        // blowout game
        if (gamePointDiff > acc.blowoutGame)
            acc.blowoutGame = gamePointDiff;

        return acc;
    }, {
        matchups: matchupData,
        challengerTotal: 0,
        opponentTotal: 0,
        challengerWins: 0,
        opponentWins: 0,
        challengerHiscore: 0,
        opponentHiscore: 0,
        challengerLowScore: 0,
        opponentLowScore: 0,
        closestGame: 0,
        blowoutGame: 0
    });
    const totalMatchupCount = partialStats.matchups.length;
    const stats = {
        ...partialStats,
        challengerAvgPoints:
            (partialStats.challengerTotal / totalMatchupCount).toFixed(2),
        opponentAvgPoints:
            (partialStats.opponentTotal / totalMatchupCount).toFixed(2),
        challengerWinAvg:
            Math.round((partialStats.challengerWins / totalMatchupCount) * 100),
        opponentWinAvg:
            Math.round((partialStats.opponentWins / totalMatchupCount) * 100),
        closestGame: partialStats.closestGame.toFixed(2),
        blowoutGame: partialStats.blowoutGame.toFixed(2),
        challengerTotal: partialStats.challengerTotal.toFixed(2),
        opponentTotal: partialStats.opponentTotal.toFixed(2),
        challengerHiscore: partialStats.challengerHiscore.toFixed(2),
        opponentHiscore: partialStats.opponentHiscore.toFixed(2),
        challengerLowScore: partialStats.challengerLowScore.toFixed(2),
        opponentLowScore: partialStats.opponentLowScore.toFixed(2),
    };

    return stats;
}