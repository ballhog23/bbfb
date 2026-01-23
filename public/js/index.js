"use strict";
console.log("I'm just here so I don't get fined.");
const matchupsWrapper = document.getElementById("matchups-wrapper");
const leaguesSelect = document.querySelector("#league-select");
const weeksSelect = document.querySelector("#week-select");
window.addEventListener("DOMContentLoaded", () => {
    const initialState = {
        leagueId: leaguesSelect.value,
        weekValue: weeksSelect.value,
        matchupsHTML: matchupsWrapper.innerHTML
    };
    history.replaceState(initialState, "", location.href);
});
window.addEventListener("popstate", (event) => {
    const state = event.state;
    if (!state)
        return;
    applyState(state);
});
leaguesSelect.addEventListener("change", onSelectChange);
weeksSelect.addEventListener("change", onSelectChange);
async function onSelectChange() {
    const leagueId = leaguesSelect.value;
    const weekValue = weeksSelect.value;
    const apiURL = `/api/matchups/leagues/${leagueId}/weeks/${weekValue}`;
    const pageURL = `/matchups/leagues/${leagueId}/weeks/${weekValue}`;
    const { matchups } = await fetchJSON(apiURL);
    const html = matchups.map(renderMatchupCard).join("");
    const state = {
        leagueId,
        weekValue,
        matchupsHTML: html
    };
    history.pushState(state, "", pageURL);
    applyState(state);
}
function applyState(state) {
    matchupsWrapper.innerHTML = state.matchupsHTML;
    leaguesSelect.value = state.leagueId;
    weeksSelect.value = state.weekValue;
}
function renderMatchupCard([away, home]) {
    return `
        <div class="matchup-card">
            <div class="home-team">
                <h2>${escapeHTML(home.team ?? home.owner)}</h2>
                <p>${escapeHTML(home.points)}</p>
            </div>
            <span>vs</span>
            <div class="away-team">
                <h2>${escapeHTML(away.team ?? away.owner)}</h2>
                <p>${escapeHTML(away.points)}</p>
            </div>
        </div>
    `;
}
async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`HTTP ${res.status} at ${url}`);
    return await res.json();
}
function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}
