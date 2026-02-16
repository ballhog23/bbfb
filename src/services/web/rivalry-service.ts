import { NotFoundError } from "../../lib/errors.js";
import { buildCompletedLeaguesIds } from "../../lib/helpers.js";
import { selectAllSleeperUsersData } from "../../db/queries/sleeper-users.js";
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
    console.log(challenger, opponent);
    return {};
}
