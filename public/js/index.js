import { fetchJSON, escapeForHTML, findNearestElement } from "./lib.js";
console.log("I'm just here so I don't get fined");
const matchupsWrapper = document.getElementById("matchups-wrapper");
const leaguesSelect = document.querySelector("#league-select");
const weeksSelect = document.querySelector("#week-select");
const matchupsTitle = document.querySelector(".matchups-container header h2");
const standingsTableBody = document.querySelector(".standings-container table tbody");
const standingsTitle = document.querySelector(".standings-container header h2");
window.addEventListener("DOMContentLoaded", () => {
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
    const clickedCard = findNearestElement(event, ".matchup-card");
    const clickedDialog = findNearestElement(event, "dialog");
    const clickedStandingsRow = findNearestElement(event, "tbody tr");
    if (!clickedCard && !clickedDialog && !clickedStandingsRow)
        return;
    if (clickedCard && !clickedDialog && !clickedStandingsRow) {
        clickedCard.querySelector("dialog").showModal();
        return;
    }
    if (clickedDialog) {
        const inside = findNearestElement(event, ".matchups-dialog-wrapper");
        if (!inside)
            clickedDialog.close();
        return;
    }
    if (clickedStandingsRow) {
        clickedStandingsRow.querySelector("dialog").showModal();
    }
});
leaguesSelect.addEventListener("change", onSelectChange);
weeksSelect.addEventListener("change", onSelectChange);
async function onSelectChange() {
    const leagueId = leaguesSelect.value;
    const leagueSeasonOption = leaguesSelect.querySelector(`[value='${leagueId}']`);
    const weekValue = weeksSelect.value;
    const weekOption = weeksSelect.querySelector(`[value='${weekValue}']`);
    const apiURL = `/api/matchups-page/leagues/${leagueId}/weeks/${weekValue}`;
    const pageURL = `/matchups/leagues/${leagueId}/weeks/${weekValue}`;
    const pageData = await fetchJSON(apiURL);
    const { matchups, rosters } = pageData;
    console.log('MATCHUPS', matchups);
    console.log('ROSTERS', rosters);
    const state = {
        matchupsTitle: `Season ${leagueSeasonOption.innerText} - ${weekOption.innerText}`,
        leagueId,
        weekValue,
        matchupsHTML: matchups.map(renderMatchupCard).join(""),
        standingsTitle: `${leagueSeasonOption.innerText} Regular Season Standings`,
        standingsHTML: rosters.map(renderStandingsRow).join("")
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
function renderPlayerRow(player) {
    const hasPoints = "points" in player;
    return `
    <div class="player-card">
        <img
            class="player-avatar"
            src="https://placehold.co/50"
            alt="${escapeForHTML(player.playerName)} headshot"
            loading="lazy"
        />
        <div class="player-info">
            <div class="player-name">${escapeForHTML(player.playerName)}</div>
            <div class="player-meta">
                <span class="player-position pos-${escapeForHTML(player.position.toLowerCase())}">
                    ${escapeForHTML(player.position)}
                </span>
                <span class="player-team">${escapeForHTML(player.team)}</span>
            </div>
        </div>
        ${hasPoints
        ? `<div class="player-stats">
                       <span class="stat-value">${escapeForHTML(player.points)}</span>
                   </div>`
        : ""}
    </div>
    `;
}
function renderPlayerList(players, heading) {
    if (!players || !players.length)
        return "";
    return `
    ${heading ? `<h4>${escapeForHTML(heading)}</h4>` : ""}
    <div class="lineup-wrapper">
        ${players.map(renderPlayerRow).join("")}
    </div>
    `;
}
function renderMatchupCardBody([home, away]) {
    const teamName = (t) => t.team ?? t.owner;
    return `
    <div class="home-team">
        <h3>${escapeForHTML(teamName(home))}</h3>
        <p>${escapeForHTML(home.points)}</p>
    </div>
    <span class="vs">vs</span>
    <div class="away-team">
        <h3>${escapeForHTML(teamName(away))}</h3>
        <p>${escapeForHTML(away.points)}</p>
    </div>
    `;
}
function renderMatchupModal([home, away]) {
    return `
    <dialog class="matchup-modal">
        <button>Close</button>
        <section class="matchups-dialog-wrapper">
            <article class="matchup-card">
                ${renderMatchupCardBody([away, home])}
            </article>

            <div class="rosters-wrapper">
                <div class="roster home-team-players">
                    ${renderPlayerList(home.startingRoster, "Starting")}
                    ${renderPlayerList(home.benchRoster, "Bench")}
                    ${renderPlayerList(home.reserveRoster, "Injured Reserve")}
                </div>

                <div class="roster away-team-players">
                    ${renderPlayerList(away.startingRoster, "Starting")}
                    ${renderPlayerList(away.benchRoster, "Bench")}
                    ${renderPlayerList(away.reserveRoster, "Injured Reserve")}
                </div>
            </div>
        </section>
    </dialog>
    `;
}
function renderMatchupCard(match) {
    return `
    <article class="matchup-card">
        ${renderMatchupCardBody(match)}
        ${renderMatchupModal(match)}
    </article>
    `;
}
function renderStandingsRow(team) {
    const displayName = team.teamName ?? team.ownerName;
    return `
    <tr>
        <th scope="row">${escapeForHTML(displayName)}</th>
        <td>${escapeForHTML(team.pointsFor)}</td>
        <td>${escapeForHTML(team.pointsAgainst)}</td>
        <td>${escapeForHTML(team.wins)} / ${escapeForHTML(team.losses)}</td>
        <td class="roster-modal-cell">
            <dialog class="matchup-modal rosters-modal">
                <button>Close</button>
                <div class="players-wrapper">
                    <h3>${escapeForHTML(displayName)}</h3>
                    ${renderPlayerList(team.startingRoster, "Starting")}
                    ${renderPlayerList(team.benchRoster, "Bench")}
                    ${renderPlayerList(team.reserveRoster, "Injured Reserve")}
                </div>
            </dialog>
        </td>
    </tr>
    `;
}
