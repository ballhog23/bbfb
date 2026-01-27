import { fetchJSON, escapeHTML, findNearestElement } from "./lib.js";
console.log("I'm just here so I don't get fined");
const matchupsWrapper = document.getElementById("matchups-wrapper");
const leaguesSelect = document.querySelector("#league-select");
const weeksSelect = document.querySelector("#week-select");
const matchupsTitle = document.querySelector(".matchups-container header h2");
const standingsTableBody = document.querySelector(".standings-container table tbody");
const standingsTitle = document.querySelector(".standings-container header h2");
window.addEventListener("DOMContentLoaded", (event) => {
    const initialState = {
        matchupsTitle: matchupsTitle.innerHTML,
        leagueId: leaguesSelect.value,
        weekValue: weeksSelect.value,
        matchupsHTML: matchupsWrapper.innerHTML,
        standingsTitle: standingsTitle.innerHTML,
        standingsHTML: standingsTableBody.innerHTML
    };
    history.replaceState(initialState, "", location.href);
});
window.addEventListener("popstate", (event) => {
    const state = event.state;
    if (!state)
        return;
    applyState(state);
});
window.addEventListener("click", (event) => {
    const clickedCard = findNearestElement(event, '.matchup-card');
    const clickedDialog = findNearestElement(event, 'dialog');
    const clickedStandingsRow = findNearestElement(event, 'tbody tr');
    if (!clickedCard && !clickedDialog && !clickedStandingsRow)
        return;
    if (clickedCard && !clickedDialog && !clickedStandingsRow) {
        const dialog = clickedCard.querySelector('dialog');
        dialog.showModal();
    }
    if (clickedDialog) {
        const clickedPlayersWrapper = findNearestElement(event, '.players-wrapper');
        if (!clickedPlayersWrapper) {
            clickedDialog.close();
        }
        return;
    }
    if (clickedStandingsRow) {
        const dialog = clickedStandingsRow.querySelector('dialog');
        dialog.showModal();
    }
});
leaguesSelect.addEventListener("change", onSelectChange);
weeksSelect.addEventListener("change", onSelectChange);
async function onSelectChange() {
    const leagueId = leaguesSelect.value;
    const leagueSeasonOption = leaguesSelect.querySelector(`[value='${leagueId}']`);
    const weekValue = weeksSelect.value;
    const weekOption = weeksSelect.querySelector(`[value='${weekValue}']`);
    const matchupsApiURL = `/api/matchups/leagues/${leagueId}/weeks/${weekValue}`;
    const standingsApiURL = `/api/matchup-outcomes/leagues/${leagueId}`;
    const rostersApiURL = `/api/rosters/leagues/${leagueId}`;
    const pageURL = `/matchups/leagues/${leagueId}/weeks/${weekValue}`;
    const queries = await Promise.all([
        fetchJSON(matchupsApiURL),
        fetchJSON(standingsApiURL),
        fetchJSON(rostersApiURL),
    ]);
    const [matchupsResponse, regularSeasonStandingsRepsonse, rostersResponse] = queries;
    const { matchups } = matchupsResponse;
    const { regularSeasonStandings } = regularSeasonStandingsRepsonse;
    const { rosters } = rostersResponse;
    const rosterByUserId = new Map(rosters.map((row) => [row.userId, row]));
    const standingsRows = regularSeasonStandings.map(row => ({
        ...row,
        roster: rosterByUserId.get(row.userId)?.players ?? []
    }));
    const matchupsHTML = matchups.map(renderMatchupCard).join("");
    const matchupsTitle = `Season ${leagueSeasonOption.innerText} - ${weekOption.innerText}`;
    const standingsHTML = standingsRows.map(renderStandingsTableRowHTML).join("");
    const standingsTitle = `${leagueSeasonOption.innerText} Regular Season Standings`;
    const state = {
        matchupsTitle,
        leagueId,
        weekValue,
        matchupsHTML,
        standingsTitle,
        standingsHTML
    };
    history.pushState(state, "", pageURL);
    applyState(state);
}
function applyState(state) {
    matchupsTitle.innerHTML = state.matchupsTitle;
    matchupsWrapper.innerHTML = state.matchupsHTML;
    leaguesSelect.value = state.leagueId;
    weeksSelect.value = state.weekValue;
    standingsTitle.innerHTML = state.standingsTitle;
    standingsTableBody.innerHTML = state.standingsHTML;
}
function renderMatchupCard([away, home]) {
    return `
        <div class="matchup-card">
            <div class="home-team">
                <h3>${escapeHTML(home.team ?? home.owner)}</h3>
                <p>${escapeHTML(home.points)}</p>
            </div>
            <span>vs</span>
            <div class="away-team">
                <h3>${escapeHTML(away.team ?? away.owner)}</h3>
                <p>${escapeHTML(away.points)}</p>
            </div>
            <dialog class="matchup-modal">
                <button>Close</button>
                <div class="players-wrapper">
                    <div class="home-team-players">
                        ${renderPlayersHTML(home.rosterPlayers)}
                    </div>
                    <div class="away-team-players">
                        ${renderPlayersHTML(away.rosterPlayers)}
                    </div>
                </div>
            </dialog>
        </div>
    `;
}
function renderPlayersHTML(players) {
    const html = players.map(player => `<p>${escapeHTML(player.position)}</p>` +
        `<p>${escapeHTML(player.playerName)}</p>` +
        `<p>${escapeHTML(player.points)}</p>` +
        `<p>${escapeHTML(player.starter ? "true" : "false")}</p>`).join('');
    return html;
}
function renderStandingsTableRowHTML(team) {
    return `
        <tr>
            <th scope="row">${escapeHTML(team.teamName ?? team.ownerName)}</th>
            <td>${escapeHTML(team.pointsFor)}</td>
            <td>${escapeHTML(team.pointsAgainst)}</td>
            <td>${escapeHTML(team.wins)}/${escapeHTML(team.losses)}</td>
            <td class="roster-modal-cell">
                <dialog class="matchup-modal rosters-modal">
                    <button>Close</button>
                        <div class="players-wrapper">
                            ${renderRosterPlayersHTML(team.roster)}
                        </div>
                </dialog>
            </td>
        </tr>
    `;
}
function renderRosterPlayersHTML(players) {
    const html = players.map(player => `
            <p>${escapeHTML(player.position)}</p>
            <p>${escapeHTML(player.playerName)}</p>
            <p>${escapeHTML(player.starter ? "true" : "false")}</p>
        `).join('');
    return html;
}
