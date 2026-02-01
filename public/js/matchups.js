// public-ts/lib.ts
async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} at ${url}`);
  }
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON, received ${contentType}`);
  }
  return await response.json();
}
function escapeForHTML(value) {
  const div = document.createElement("div");
  div.textContent = String(value);
  return div.innerHTML;
}
function findNearestElement(event, selector) {
  const target = event.target;
  if (!target) return null;
  return target.closest(selector);
}

// public-ts/matchups.ts
var matchupsContent = document.getElementById("matchups-content");
var standingsContainer = document.querySelector(".standings-container");
var leaguesSelect = document.querySelector("#league-select");
var weeksSelect = document.querySelector("#week-select");
var matchupsTitle = document.querySelector("#season-header");
var seasonNavButtons = document.querySelectorAll(".season-navigation .nav-link");
window.addEventListener("DOMContentLoaded", () => {
  const initialWeek = weeksSelect ? parseInt(weeksSelect.value) : 1;
  const initialState = {
    matchupsTitle: matchupsTitle.innerHTML,
    leagueId: leaguesSelect.value,
    weekValue: initialWeek,
    allLeagues: [],
    contentHTML: matchupsContent.innerHTML,
    standingsHTML: standingsContainer.innerHTML,
    isPlayoffs: initialWeek >= 15
  };
  history.replaceState(initialState, "", location.href);
});
window.addEventListener("popstate", (event) => {
  const state = event.state;
  if (!state) return;
  applyState(state);
});
window.addEventListener("click", (event) => {
  const clickedCard = findNearestElement(event, ".matchup-card");
  const clickedDialog = findNearestElement(event, "dialog");
  const clickedStandingsRow = findNearestElement(event, "tbody tr");
  const clickedBracketTab = findNearestElement(event, ".tab-button");
  if (clickedBracketTab) {
    const bracketType = clickedBracketTab.dataset.bracket;
    if (bracketType) {
      document.querySelectorAll(".tab-button").forEach((btn) => btn.classList.remove("active"));
      clickedBracketTab.classList.add("active");
      document.querySelectorAll(".bracket-container").forEach((container) => {
        container.classList.remove("active");
      });
      const targetBracket = document.querySelector(`[data-bracket-type="${bracketType}"]`);
      if (targetBracket) {
        targetBracket.classList.add("active");
      }
    }
    return;
  }
  if (!clickedCard && !clickedDialog && !clickedStandingsRow) return;
  if (clickedCard && !clickedDialog && !clickedStandingsRow) {
    clickedCard.querySelector("dialog")?.showModal();
    return;
  }
  if (clickedDialog) {
    const inside = findNearestElement(event, ".matchups-dialog-wrapper, .players-wrapper");
    if (!inside) clickedDialog.close();
    return;
  }
  if (clickedStandingsRow) {
    clickedStandingsRow.querySelector("dialog")?.showModal();
    return;
  }
});
seasonNavButtons.forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    const view = e.target.dataset.view;
    const currentState = history.state;
    const currentWeek = currentState?.weekValue || 1;
    let week;
    if (view === "regular") {
      week = currentWeek >= 15 ? 14 : currentWeek;
    } else {
      week = 17;
    }
    seasonNavButtons.forEach((b) => b.classList.remove("active"));
    e.target.classList.add("active");
    await loadMatchupsData(leaguesSelect.value, week);
  });
});
leaguesSelect?.addEventListener("change", onSelectChange);
weeksSelect?.addEventListener("change", onSelectChange);
async function loadMatchupsData(leagueId, week) {
  const apiURL = `/api/matchups-page/leagues/${leagueId}/weeks/${week}`;
  const pageURL = `/matchups/leagues/${leagueId}/weeks/${week}`;
  const pageData = await fetchJSON(apiURL);
  const isPlayoffs = pageData.currentWeek >= 15;
  const state = isPlayoffs ? buildPlayoffsState(pageData) : buildRegularSeasonState(pageData);
  history.pushState(state, "", pageURL);
  applyState(state);
}
async function onSelectChange() {
  const currentLeagueSelect = document.querySelector("#league-select");
  const currentWeekSelect = document.querySelector("#week-select");
  if (!currentLeagueSelect) return;
  const leagueId = currentLeagueSelect.value;
  const weekValue = currentWeekSelect ? parseInt(currentWeekSelect.value) : 17;
  await loadMatchupsData(leagueId, weekValue);
}
function buildRegularSeasonState(pageData) {
  const { matchups, rosters, currentLeagueSeason, currentWeek, allLeagues, currentLeagueId } = pageData;
  return {
    matchupsTitle: `Season ${currentLeagueSeason} - Week ${currentWeek}`,
    leagueId: currentLeagueId,
    weekValue: currentWeek,
    allLeagues,
    contentHTML: renderRegularSeasonView(matchups, allLeagues, currentLeagueId, currentWeek),
    standingsHTML: renderStandingsSection(rosters, currentLeagueSeason),
    isPlayoffs: false
  };
}
function buildPlayoffsState(pageData) {
  const { matchups, rosters, currentLeagueSeason, currentWeek, allLeagues, currentLeagueId } = pageData;
  return {
    matchupsTitle: `Season ${currentLeagueSeason} - Post Season`,
    leagueId: currentLeagueId,
    weekValue: currentWeek,
    allLeagues,
    contentHTML: renderPlayoffsView(matchups, allLeagues, currentLeagueId),
    standingsHTML: renderStandingsSection(rosters, currentLeagueSeason),
    isPlayoffs: true
  };
}
function applyState(state) {
  matchupsTitle.innerHTML = state.matchupsTitle;
  matchupsContent.innerHTML = state.contentHTML;
  standingsContainer.innerHTML = state.standingsHTML;
  leaguesSelect.value = state.leagueId;
  if (weeksSelect) {
    weeksSelect.value = state.weekValue.toString();
  }
  seasonNavButtons.forEach((btn) => {
    const view = btn.dataset.view;
    if (view === "playoffs" && state.isPlayoffs || view === "regular" && !state.isPlayoffs) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
  const newLeagueSelect = document.querySelector("#league-select");
  const newWeekSelect = document.querySelector("#week-select");
  if (newLeagueSelect) {
    newLeagueSelect.addEventListener("change", onSelectChange);
  }
  if (newWeekSelect) {
    newWeekSelect.addEventListener("change", onSelectChange);
  }
}
function renderRegularSeasonView(matchups, allLeagues, currentLeagueId, currentWeek) {
  return `
        <div class="select-wrapper">
            ${renderLeagueSelect(allLeagues, currentLeagueId)}
            ${renderWeekSelect(currentWeek)}
        </div>
        <section id="matchups-wrapper">
            ${matchups.map(renderMatchupCard).join("")}
        </section>
    `;
}
function renderPlayoffsView(brackets, allLeagues, currentLeagueId) {
  return `
        <div class="post-season-container">
            <div class="controls-wrapper">
                <div class="select-wrapper">
                    ${renderLeagueSelect(allLeagues, currentLeagueId)}
                </div>
                <div class="bracket-tabs">
                    <button class="btn tab-button active" data-bracket="winnersBracket">Winners</button>
                    <button class="btn tab-button" data-bracket="losersBracket">Losers</button>
                </div>
            </div>
            <section class="playoff-bracket">
                <div class="bracket-container active" data-bracket-type="winnersBracket">
                    ${renderBracket(brackets.winnersBracket)}
                </div>
                <div class="bracket-container" data-bracket-type="losersBracket">
                    ${renderBracket(brackets.losersBracket)}
                </div>
            </section>
        </div>
    `;
}
function renderLeagueSelect(allLeagues, currentLeagueId) {
  return `
        <div class="league-select-wrapper">
            <label for="league-select">Select League:</label>
            <select id="league-select" name="select-league">
                ${allLeagues.map((league) => `
                    <option value="${escapeForHTML(league.leagueId)}" ${league.leagueId === currentLeagueId ? "selected" : ""}>
                        ${escapeForHTML(league.season)}
                    </option>
                `).join("")}
            </select>
        </div>
    `;
}
function renderWeekSelect(currentWeek) {
  return `
        <div class="week-select-wrapper">
            <label for="week-select">Select Week:</label>
            <select id="week-select" name="select-week">
                ${Array.from({ length: 14 }, (_, i) => i + 1).map((w) => `
                    <option value="${w}" ${w === currentWeek ? "selected" : ""}>
                        Week ${w}
                    </option>
                `).join("")}
            </select>
        </div>
    `;
}
function renderBracket(rounds) {
  if (!rounds || rounds.length === 0) {
    return '<p class="no-data">No bracket data available</p>';
  }
  return `
        <div class="bracket-rounds">
            ${rounds.map((roundData) => `
                <div class="round-container">
                    <div class="round-header">
                        <h3>Round ${roundData.round}</h3>
                    </div>
                    <div class="round-matchups">
                        ${roundData.matchups.map(renderPlayoffMatchupCard).join("")}
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}
function renderPlayoffMatchupCard(matchup) {
  return `
        <article class="matchup-card" data-matchup-id="${matchup.bracketMatchupId}" data-week="${matchup.week}">
            ${renderPlayoffMatchupCardBody(matchup)}
            ${renderPlayoffMatchupModal(matchup)}
        </article>
    `;
}
function renderPlayoffMatchupCardBody(matchup) {
  const hasTeamName = (team, owner) => team || owner || "TBD";
  const isWinner = (rosterId) => matchup.winnerId === rosterId;
  return `
        <div class="home-team ${isWinner(matchup.t1) ? "winner" : ""}">
            <h3>${escapeForHTML(hasTeamName(matchup.team1, matchup.owner1))}</h3>
            <p>${matchup.points1 != null ? escapeForHTML(parseFloat(matchup.points1).toFixed(2)) : "TBD"}</p>
        </div>
        <span class="vs">vs</span>
        <div class="away-team ${isWinner(matchup.t2) ? "winner" : ""}">
            <h3>${escapeForHTML(hasTeamName(matchup.team2, matchup.owner2))}</h3>
            <p>${matchup.points2 != null ? escapeForHTML(parseFloat(matchup.points2).toFixed(2)) : "TBD"}</p>
        </div>
    `;
}
function renderPlayoffMatchupModal(matchup) {
  return `
        <dialog class="matchup-modal">
            <button>Close</button>
            <section class="matchups-dialog-wrapper">
                <article class="matchup-card">
                    ${renderPlayoffMatchupCardBody(matchup)}
                </article>
                <div class="rosters-wrapper">
                    <div class="roster home-team-players">
                        ${renderPlayerList(matchup.startingRoster1, "Starting")}
                        ${renderPlayerList(matchup.benchRoster1, "Bench")}
                    </div>
                    <div class="roster away-team-players">
                        ${renderPlayerList(matchup.startingRoster2, "Starting")}
                        ${renderPlayerList(matchup.benchRoster2, "Bench")}
                    </div>
                </div>
            </section>
        </dialog>
    `;
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
                <span class="player-position pos-${escapeForHTML(player.position?.toLowerCase() || "")}">
                    ${escapeForHTML(player.position)}
                </span>
                <span class="player-team">${escapeForHTML(player.team || "")}</span>
            </div>
        </div>
        ${hasPoints ? `<div class="player-stats">
                       <span class="stat-value">${escapeForHTML(player.points)}</span>
                   </div>` : ""}
    </div>
    `;
}
function renderPlayerList(players, label) {
  if (!players || !players.length) return "";
  return `
    <div class="player-list-section">
        ${label ? `<h4 class="roster-section-label">${escapeForHTML(label)}</h4>` : ""}
        <div class="player-list">
            ${players.map(renderPlayerRow).join("")}
        </div>
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
                ${renderMatchupCardBody([home, away])}
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
function renderStandingsSection(rosters, season) {
  return `
        <header>
            <h2>${escapeForHTML(season)} Regular Season Standings</h2>
        </header>
        <section id="standings-wrapper">
            <table>
                <caption>Standings are based on Regular Season Head-to-Heads</caption>
                <thead>
                    <tr>
                        <th scope="col">Team</th>
                        <th scope="col">Points For</th>
                        <th scope="col">Points Against</th>
                        <th scope="col">W/L</th>
                    </tr>
                </thead>
                <tbody>
                    ${rosters.map(renderStandingsRow).join("")}
                </tbody>
            </table>
        </section>
    `;
}
function renderStandingsRow(team) {
  const displayName = team.teamName ?? team.ownerName;
  return `
    <tr>
        <th scope="row">${escapeForHTML(displayName)}</th>
        <td>${escapeForHTML(team.pointsFor.toString())}</td>
        <td>${escapeForHTML(team.pointsAgainst.toString())}</td>
        <td>${escapeForHTML(team.wins.toString())} / ${escapeForHTML(team.losses.toString())}</td>
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
