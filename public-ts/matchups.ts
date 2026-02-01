import {
    fetchJSON, escapeForHTML, findNearestElement
} from "./lib.js";

const matchupsContent = document.getElementById("matchups-content")!;
const standingsContainer = document.querySelector(".standings-container")!;
const leaguesSelect = document.querySelector<HTMLSelectElement>("#league-select")!;
const weeksSelect = document.querySelector<HTMLSelectElement>("#week-select");
const matchupsTitle = document.querySelector("#season-header")!;
const seasonNavButtons = document.querySelectorAll<HTMLButtonElement>(".season-navigation .nav-link");

type MatchupPlayer = {
    playerName: string;
    position: string;
    team: string;
    points: string;
};

type RosterPlayer = {
    playerName: string;
    position: string;
    team: string;
};

type LeagueData = {
    leagueId: string;
    season: string;
};

type MatchupRow = {
    season: string;
    week: number;
    matchupId: number | null;
    team: string | null;
    owner: string;
    points: string;
    startingRoster: MatchupPlayer[] | null;
    reserveRoster: MatchupPlayer[] | null;
    benchRoster: MatchupPlayer[] | null;
};

type MatchupTuple = [MatchupRow, MatchupRow];
type Matchups = MatchupTuple[];

type PlayoffMatchup = {
    bracketMatchupId: number;
    week: number;
    matchupId: number | null;
    winnerId: number | null;
    loserId: number | null;
    place: number | null;
    t1: number | null;
    team1: string | null;
    owner1: string | null;
    points1: string | null;
    startingRoster1: MatchupPlayer[] | null;
    benchRoster1: MatchupPlayer[] | null;
    t2: number | null;
    team2: string | null;
    owner2: string | null;
    points2: string | null;
    startingRoster2: MatchupPlayer[] | null;
    benchRoster2: MatchupPlayer[] | null;
    t1FromWinner: number | null;
    t1FromLoser: number | null;
    t2FromWinner: number | null;
    t2FromLoser: number | null;
};

type PlayoffRound = {
    bracketType: string;
    round: number;
    matchups: PlayoffMatchup[];
};

type PlayoffBrackets = {
    winnersBracket: PlayoffRound[];
    losersBracket: PlayoffRound[];
};

type RostersRow = {
    ownerName: string;
    teamName: string | null;
    pointsFor: number;
    pointsAgainst: number;
    wins: number;
    losses: number;
    startingRoster: RosterPlayer[] | null;
    reserveRoster: RosterPlayer[] | null;
    benchRoster: RosterPlayer[] | null;
};

type RegularSeasonResponse = {
    allLeagues: LeagueData[];
    currentLeagueId: string;
    currentLeagueSeason: string;
    currentWeek: number;
    matchups: Matchups;
    rosters: RostersRow[];
};

type PlayoffsResponse = {
    allLeagues: LeagueData[];
    currentLeagueId: string;
    currentLeagueSeason: string;
    currentWeek: number;
    matchups: PlayoffBrackets;
    rosters: RostersRow[];
};

type MatchupsPageResponse = RegularSeasonResponse | PlayoffsResponse;

type PageState = {
    matchupsTitle: string;
    leagueId: string;
    weekValue: number;
    allLeagues: LeagueData[];
    contentHTML: string;
    standingsHTML: string;
    isPlayoffs: boolean;
};

type MatchupCard = HTMLElement;
type MatchupModal = HTMLDialogElement;
type PlayersWrapper = HTMLDivElement;

window.addEventListener("DOMContentLoaded", () => {
    const initialWeek = weeksSelect ? parseInt(weeksSelect.value) : 1;
    const initialState: PageState = {
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
    const state = event.state as PageState | null;
    if (!state) return;
    applyState(state);
});

window.addEventListener("click", (event) => {
    const clickedCard = findNearestElement<MatchupCard>(event, ".matchup-card");
    const clickedDialog = findNearestElement<MatchupModal>(event, "dialog");
    const clickedStandingsRow = findNearestElement(event, "tbody tr");
    const clickedBracketTab = findNearestElement<HTMLButtonElement>(event, ".tab-button");

    if (clickedBracketTab) {
        const bracketType = clickedBracketTab.dataset.bracket;
        if (bracketType) {
            // Update active states
            document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
            clickedBracketTab.classList.add("active");

            // Toggle bracket containers
            document.querySelectorAll(".bracket-container").forEach(container => {
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
        clickedCard.querySelector<MatchupModal>("dialog")?.showModal();
        return;
    }

    if (clickedDialog) {
        const inside = findNearestElement<PlayersWrapper>(event, ".matchups-dialog-wrapper, .players-wrapper");
        if (!inside) clickedDialog.close();
        return;
    }

    if (clickedStandingsRow) {
        clickedStandingsRow.querySelector<MatchupModal>("dialog")?.showModal();
        return;
    }
});

// Season navigation buttons
seasonNavButtons.forEach(btn => {
    btn.addEventListener("click", async (e) => {
        const view = (e.target as HTMLButtonElement).dataset.view;
        const currentState = history.state as PageState | null;
        const currentWeek = currentState?.weekValue || 1;

        // Determine the target week based on view and current context
        let week: number;
        if (view === "regular") {
            // If currently in playoffs, go to week 14 (last regular season week)
            // Otherwise stay at current week
            week = currentWeek >= 15 ? 14 : currentWeek;
        } else {
            // Always go to week 17 for playoffs to show complete bracket
            // Backend will clamp to displayWeek if season isn't that far yet
            week = 17;
        }

        // Update active state
        seasonNavButtons.forEach(b => b.classList.remove("active"));
        (e.target as HTMLButtonElement).classList.add("active");

        // Load data for the new view
        await loadMatchupsData(leaguesSelect.value, week);
    });
});

leaguesSelect?.addEventListener("change", onSelectChange);
weeksSelect?.addEventListener("change", onSelectChange);

async function loadMatchupsData(leagueId: string, week: number) {
    const apiURL = `/api/matchups-page/leagues/${leagueId}/weeks/${week}`;
    const pageURL = `/matchups/leagues/${leagueId}/weeks/${week}`;

    const pageData = await fetchJSON<MatchupsPageResponse>(apiURL);
    const isPlayoffs = pageData.currentWeek >= 15;

    const state: PageState = isPlayoffs
        ? buildPlayoffsState(pageData as PlayoffsResponse)
        : buildRegularSeasonState(pageData as RegularSeasonResponse);

    history.pushState(state, "", pageURL);
    applyState(state);
}

async function onSelectChange() {
    // Query for current league select in DOM (may have been re-rendered)
    const currentLeagueSelect = document.querySelector<HTMLSelectElement>("#league-select");
    const currentWeekSelect = document.querySelector<HTMLSelectElement>("#week-select");

    if (!currentLeagueSelect) return;

    const leagueId = currentLeagueSelect.value;

    // If in playoffs view (no week select), use week 17
    // Otherwise read from week select
    const weekValue = currentWeekSelect ? parseInt(currentWeekSelect.value) : 17;

    await loadMatchupsData(leagueId, weekValue);
}

function buildRegularSeasonState(pageData: RegularSeasonResponse): PageState {
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

function buildPlayoffsState(pageData: PlayoffsResponse): PageState {
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

function applyState(state: PageState) {
    matchupsTitle.innerHTML = state.matchupsTitle;
    matchupsContent.innerHTML = state.contentHTML;
    standingsContainer.innerHTML = state.standingsHTML;
    leaguesSelect.value = state.leagueId;

    if (weeksSelect) {
        weeksSelect.value = state.weekValue.toString();
    }

    // Update navigation active state
    seasonNavButtons.forEach(btn => {
        const view = btn.dataset.view;
        if ((view === "playoffs" && state.isPlayoffs) || (view === "regular" && !state.isPlayoffs)) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Reattach event listeners for new dropdowns
    const newLeagueSelect = document.querySelector<HTMLSelectElement>("#league-select");
    const newWeekSelect = document.querySelector<HTMLSelectElement>("#week-select");

    if (newLeagueSelect) {
        newLeagueSelect.addEventListener("change", onSelectChange);
    }

    if (newWeekSelect) {
        newWeekSelect.addEventListener("change", onSelectChange);
    }
}

function renderRegularSeasonView(
    matchups: Matchups,
    allLeagues: LeagueData[],
    currentLeagueId: string,
    currentWeek: number
): string {
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

function renderPlayoffsView(
    brackets: PlayoffBrackets,
    allLeagues: LeagueData[],
    currentLeagueId: string
): string {
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

function renderLeagueSelect(allLeagues: LeagueData[], currentLeagueId: string): string {
    return `
        <div class="league-select-wrapper">
            <label for="league-select">Select League:</label>
            <select id="league-select" name="select-league">
                ${allLeagues.map(league => `
                    <option value="${escapeForHTML(league.leagueId)}" ${league.leagueId === currentLeagueId ? 'selected' : ''}>
                        ${escapeForHTML(league.season)}
                    </option>
                `).join("")}
            </select>
        </div>
    `;
}

function renderWeekSelect(currentWeek: number): string {
    return `
        <div class="week-select-wrapper">
            <label for="week-select">Select Week:</label>
            <select id="week-select" name="select-week">
                ${Array.from({ length: 14 }, (_, i) => i + 1).map(w => `
                    <option value="${w}" ${w === currentWeek ? 'selected' : ''}>
                        Week ${w}
                    </option>
                `).join("")}
            </select>
        </div>
    `;
}

function renderBracket(rounds: PlayoffRound[]): string {
    if (!rounds || rounds.length === 0) {
        return '<p class="no-data">No bracket data available</p>';
    }

    return `
        <div class="bracket-rounds">
            ${rounds.map(roundData => `
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

function renderPlayoffMatchupCard(matchup: PlayoffMatchup): string {
    return `
        <article class="matchup-card" data-matchup-id="${matchup.bracketMatchupId}" data-week="${matchup.week}">
            ${renderPlayoffMatchupCardBody(matchup)}
            ${renderPlayoffMatchupModal(matchup)}
        </article>
    `;
}

function renderPlayoffMatchupCardBody(matchup: PlayoffMatchup): string {
    const hasTeamName = (team: string | null, owner: string | null) => team || owner || "TBD";
    const isWinner = (rosterId: number | null) => matchup.winnerId === rosterId;

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

function renderPlayoffMatchupModal(matchup: PlayoffMatchup): string {
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

function renderPlayerRow(player: MatchupPlayer | RosterPlayer) {
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
        ${hasPoints
            ? `<div class="player-stats">
                       <span class="stat-value">${escapeForHTML(player.points)}</span>
                   </div>`
            : ""
        }
    </div>
    `;
}

function renderPlayerList(
    players: MatchupPlayer[] | RosterPlayer[] | null,
    label?: string
) {
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

function renderMatchupCardBody([home, away]: MatchupTuple) {
    const teamName = (t: MatchupRow) => t.team ?? t.owner;

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

function renderMatchupModal([home, away]: MatchupTuple) {
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

function renderMatchupCard(match: MatchupTuple) {
    return `
    <article class="matchup-card">
        ${renderMatchupCardBody(match)}
        ${renderMatchupModal(match)}
    </article>
    `;
}

function renderStandingsSection(rosters: RostersRow[], season: string): string {
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

function renderStandingsRow(team: RostersRow) {
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