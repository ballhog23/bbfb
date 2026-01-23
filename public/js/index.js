"use strict";
console.log("I'm just here so I don't get fined.");
const matchupsWrapper = document.getElementById('matchups-wrapper');
const leaguesSelect = document.querySelector('#league-select');
const weeksSelect = document.querySelector('#week-select');
let snapshotMatchupWrapper = null;
if (!matchupsWrapper)
    throw new Error("matchups-wrapper element is missing");
if (!leaguesSelect)
    throw new Error("league-select element is missing");
if (!weeksSelect)
    throw new Error("week-select element is missing");
window.addEventListener("DOMContentLoaded", async (event) => {
    snapshotMatchupWrapper = matchupsWrapper.cloneNode(true);
});
window.addEventListener("popstate", (event) => {
    if (!event.state) {
        if (!snapshotMatchupWrapper)
            throw new Error('Error replacing initial state of page');
        return matchupsWrapper.replaceWith(snapshotMatchupWrapper);
    }
    const matchupsData = event.state;
    const { leagueId, weekValue, resourceURL, matchups } = matchupsData;
    renderMatchupsSection(matchups);
    updateSelectedOption(leaguesSelect, leagueId);
});
leaguesSelect.addEventListener("change", onLeagueChange);
weeksSelect.addEventListener("change", function () {
    const leagueId = leaguesSelect?.value;
    const weekValue = this.value;
    location.href = location.origin + `/matchups/leagues/${leagueId}/weeks/${weekValue}`;
});
async function onLeagueChange() {
    const matchupsData = await readAndFetchMatchupData();
    const { leagueId, weekValue, resourceURL, matchups } = matchupsData;
    renderMatchupsSection(matchups);
    updateHistoryState(resourceURL, matchupsData);
    updateSelectedOption(leaguesSelect, leagueId);
}
function renderMatchupsSection(matchups) {
    let html = "";
    matchups.forEach(matchup => html += renderMatchupCard(matchup));
    matchupsWrapper.innerHTML = html;
}
function renderMatchupCard(matchup) {
    const [awayTeam, homeTeam] = matchup;
    return `
        <div class="matchup-card">
            <div class="home-team">
                <h2>${escapeHTML(hasTeamName(homeTeam))}</h2>
                <p>${escapeHTML(homeTeam.points)}</p>
            </div>
            <span>vs</span>
            <div class="away-team">
                <h2>${escapeHTML(hasTeamName(awayTeam))}</h2>
                <p>${escapeHTML(awayTeam.points)}</p>
            </div>
        </div>
    `;
}
async function readAndFetchMatchupData() {
    const leagueId = leaguesSelect?.value;
    const weekValue = weeksSelect?.value;
    const resourceURL = `/api/matchups/leagues/${leagueId}/weeks/${weekValue}`;
    const { matchups } = await fetchJSON(resourceURL);
    return {
        leagueId,
        weekValue,
        resourceURL,
        matchups
    };
}
function updateHistoryState(resourceURL, data) {
    const updatedURL = resourceURL.slice(4);
    return history.pushState(data, "", updatedURL);
}
function updateSelectedOption(selectElement, value) {
    return selectElement.value = value;
}
function hasTeamName(t) {
    return t.team ? t.team : t.owner;
}
async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} at ${url}`);
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        throw new Error(`Expected JSON, received ${contentType}`);
    }
    return await response.json();
}
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
