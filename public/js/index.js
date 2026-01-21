"use strict";
console.log("Just in case we need some js on the front end, here we go");
const leaguesSelect = document.querySelector('#league-select');
const weeksSelect = document.querySelector('#week-select');
leaguesSelect?.addEventListener("change", function () {
    const leagueId = this.value;
    const weekValue = weeksSelect?.value;
    location.href = location.origin + `/matchups/leagues/${leagueId}/weeks/${weekValue}`;
});
weeksSelect?.addEventListener("change", function () {
    const leagueId = leaguesSelect?.value;
    const weekValue = this.value;
    location.href = location.origin + `/matchups/leagues/${leagueId}/weeks/${weekValue}`;
});
function renderMatchupCard() {
    return `
        <div class="matchup-card">
            <div class="home-team">
                <h3></h3>
                <p></p>
            </div>
            <span>vs</span>
            <div class="away-team">
                <h3></h3>
                <p></p>
            </div>
        </div>
    `;
}
