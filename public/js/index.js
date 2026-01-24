"use strict";
console.log("I'm just here so I don't get fined.");
const matchupsWrapper = document.getElementById("matchups-wrapper");
const leaguesSelect = document.querySelector("#league-select");
const weeksSelect = document.querySelector("#week-select");
const pageTitle = document.querySelector('h1');
window.addEventListener("DOMContentLoaded", () => {
    const initialState = {
        pageTitle: pageTitle.innerHTML,
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
    console.log('popstate', state.pageTitle);
    applyState(state);
});
leaguesSelect.addEventListener("change", onSelectChange);
weeksSelect.addEventListener("change", onSelectChange);
async function onSelectChange() {
    const leagueId = leaguesSelect.value;
    const leagueSeasonOption = leaguesSelect.querySelector(`[value='${leagueId}']`);
    const weekValue = weeksSelect.value;
    const weekOption = weeksSelect.querySelector(`[value='${weekValue}']`);
    const apiURL = `/api/matchups/leagues/${leagueId}/weeks/${weekValue}`;
    const pageURL = `/matchups/leagues/${leagueId}/weeks/${weekValue}`;
    const { matchups } = await fetchJSON(apiURL);
    const matchupsHTML = matchups.map(renderMatchupCard).join("");
    const pageTitle = `Season ${leagueSeasonOption.innerText} - ${weekOption.innerText}`;
    console.log('onselect', pageTitle);
    const state = {
        pageTitle,
        leagueId,
        weekValue,
        matchupsHTML,
    };
    history.pushState(state, "", pageURL);
    applyState(state);
}
function applyState(state) {
    pageTitle.innerHTML = state.pageTitle;
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
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}
