"use strict";
console.log("I'm just here so I don't get fined.");
const matchupsWrapper = document.getElementById('matchups-wrapper');
const leaguesSelect = document.querySelector('#league-select');
const weeksSelect = document.querySelector('#week-select');
leaguesSelect?.addEventListener("change", async function () {
    const leagueId = this.value;
    const weekValue = weeksSelect?.value;
    const resourceURL = `/api/matchups/leagues/${leagueId}/weeaks/${weekValue}`;
    const { matchups } = await fetchJSON(resourceURL);
    renderMatchupsSection(matchups);
});
weeksSelect?.addEventListener("change", function () {
    const leagueId = leaguesSelect?.value;
    const weekValue = this.value;
    location.href = location.origin + `/matchups/leagues/${leagueId}/weeks/${weekValue}`;
});
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
