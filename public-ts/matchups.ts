import {
    fetchJSON, escapeForHTML, findNearestElement
} from "./shared/lib.js";
import "./shared/nav.ts";

const matchupsContent = document.getElementById("matchups-content")!;
const standingsContainer = document.querySelector(".standings-container")!;
const leaguesSelect = document.querySelector<HTMLSelectElement>("#league-select")!;
const weeksSelect = document.querySelector<HTMLSelectElement>("#week-select");
const matchupsTitle = document.querySelector("#season-header")!;
const matchupsHeader = document.querySelector(".matchups-header")!;

type MatchupPlayer = {
    playerName: string;
    position: string;
    team: string | null;
    points: string;
    playerImage: string;
};

type RosterPlayer = {
    playerName: string;
    position: string;
    team: string | null;
    playerImage: string;
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
    teamImage: string | null;
    owner: string;
    ownerImage: string;
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
    t1RosterId: number | null;
    t1Team: string | null;
    t1Owner: string | null;
    t1Points: string;
    t1StartingRoster: MatchupPlayer[] | null;
    t1BenchRoster: MatchupPlayer[] | null;
    t1TeamImage: string | null;
    t1OwnerImage: string;
    t2RosterId: number | null;
    t2Team: string | null;
    t2Owner: string | null;
    t2Points: string;
    t2StartingRoster: MatchupPlayer[] | null;
    t2BenchRoster: MatchupPlayer[] | null;
    t2TeamImage: string | null;
    t2OwnerImage: string;
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
    ownerImage: string;
    teamName: string | null;
    teamImage: string | null;
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
    isCurrentLeague: boolean;
    isPostSeason: boolean;
    matchups: Matchups;
    rosters: RostersRow[];
};

type PlayoffsResponse = {
    allLeagues: LeagueData[];
    currentLeagueId: string;
    currentLeagueSeason: string;
    currentWeek: number;
    isCurrentLeague: boolean;
    isPostSeason: boolean;
    matchups: PlayoffBrackets;
    rosters: RostersRow[];
};

type MatchupsPageResponse = RegularSeasonResponse | PlayoffsResponse;

type PageState = {
    matchupsTitle: string;
    leagueId: string;
    weekValue: number;
    contentHTML: string;
    standingsHTML: string;
    isPlayoffs: boolean;
    showSeasonNav: boolean;
};

type MatchupCard = HTMLElement;
type MatchupModal = HTMLDialogElement;
type PlayersWrapper = HTMLElement;

const isTwistedTitTeas = (owner: string | null) => owner?.toLowerCase().includes('twistedtitteas') ?? false;

window.addEventListener("DOMContentLoaded", () => {
    const initialWeek = parseInt(matchupsContent.dataset.currentWeek || "1");
    const initialState: PageState = {
        matchupsTitle: matchupsTitle.innerHTML,
        leagueId: leaguesSelect.value,
        weekValue: initialWeek,
        contentHTML: matchupsContent.innerHTML,
        standingsHTML: standingsContainer.innerHTML,
        isPlayoffs: initialWeek >= 15,
        showSeasonNav: !!document.querySelector(".season-navigation")
    };

    history.replaceState(initialState, "", location.href);
});

window.addEventListener("popstate", (event) => {
    const state = event.state as PageState | null;
    if (!state) return;
    applyState(state);
});

window.addEventListener("click", (event) => {
    const clickedCardLink = findNearestElement<HTMLAnchorElement>(event, ".matchup-card-link");
    const clickedStandingsLink = findNearestElement<HTMLAnchorElement>(event, ".standings-row-link");
    const clickedDialog = findNearestElement<MatchupModal>(event, "dialog");
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

    if (clickedCardLink) {
        event.preventDefault();
        const card = clickedCardLink.closest<MatchupCard>(".matchup-card");
        card?.querySelector<MatchupModal>("dialog")?.showModal();
        return;
    }

    if (clickedDialog) {
        const inside = findNearestElement<PlayersWrapper>(event, ".matchups-dialog-wrapper, .players-wrapper");
        if (!inside) clickedDialog.close();
        return;
    }

    if (clickedStandingsLink) {
        event.preventDefault();
        const row = clickedStandingsLink.closest<HTMLTableRowElement>("tr");
        row?.querySelector<MatchupModal>("dialog")?.showModal();
        return;
    }

    const clickedStandingsRow = findNearestElement(event, "tbody tr");
    if (clickedStandingsRow) {
        clickedStandingsRow.querySelector<MatchupModal>("dialog")?.showModal();
        return;
    }
});

// Season navigation buttons — delegated since nav is dynamically rendered
matchupsHeader.addEventListener("click", async (event) => {
    const btn = findNearestElement<HTMLButtonElement>(event as PointerEvent, ".season-navigation .nav-link");
    if (!btn) return;

    const view = btn.dataset.view;
    const currentState = history.state as PageState | null;
    const currentWeek = currentState?.weekValue || 1;

    // Determine the target week based on view and current context
    let week: number;
    if (view === "regular") {
        week = currentWeek >= 15 ? 14 : currentWeek;
    } else {
        week = 17;
    }

    // Update active state
    matchupsHeader.querySelectorAll<HTMLButtonElement>(".season-navigation .nav-link")
        .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    try {
        await loadMatchupsData(leaguesSelect.value, week);
    } catch (error: unknown) {
        if (error instanceof Error) console.error(error.message);
        else console.error(error);
    }
});

leaguesSelect?.addEventListener("change", onSelectChange);
weeksSelect?.addEventListener("change", onSelectChange);

async function loadMatchupsData(leagueId: string, week: number) {
    const apiURL = `/api/web/matchups-page/leagues/${leagueId}/weeks/${week}`;

    const pageData = await fetchJSON<MatchupsPageResponse>(apiURL);
    const isPlayoffs = pageData.currentWeek >= 15;

    // Use the server's effective week for the URL (may differ from requested week due to clamping)
    const pageURL = `/matchups/leagues/${leagueId}/weeks/${pageData.currentWeek}`;

    const state: PageState = isPlayoffs
        ? buildPlayoffsState(pageData as PlayoffsResponse)
        : buildRegularSeasonState(pageData as RegularSeasonResponse);
    history.pushState(state, "", pageURL);
    applyState(state);
}

async function onSelectChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const leagueId = leaguesSelect.value;
    const isLeagueChange = target === leaguesSelect;

    // League switch: send week 17 so previous leagues land on playoffs
    // and the server snaps the current league to its displayWeek
    // Week switch: use the selected week value
    const weekValue = isLeagueChange
        ? 17
        : parseInt(target.value);

    try {
        await loadMatchupsData(leagueId, weekValue);
    } catch (error: unknown) {
        if (error instanceof Error) console.error(error.message);
        else console.error(error);
    }
}

function buildRegularSeasonState(pageData: RegularSeasonResponse): PageState {
    const { matchups, rosters, currentLeagueSeason, currentWeek, currentLeagueId, isCurrentLeague, isPostSeason } = pageData;

    return {
        matchupsTitle: `Season ${currentLeagueSeason} - Week ${currentWeek}`,
        leagueId: currentLeagueId,
        weekValue: currentWeek,
        contentHTML: renderRegularSeasonView(matchups, currentWeek),
        standingsHTML: renderStandingsSection(rosters, currentLeagueSeason),
        isPlayoffs: false,
        showSeasonNav: !isCurrentLeague || isPostSeason
    };
}

function buildPlayoffsState(pageData: PlayoffsResponse): PageState {
    const { matchups, rosters, currentLeagueSeason, currentWeek, currentLeagueId } = pageData;

    return {
        matchupsTitle: `Season ${currentLeagueSeason} - Playoffs`,
        leagueId: currentLeagueId,
        weekValue: currentWeek,
        contentHTML: renderPlayoffsView(matchups),
        standingsHTML: renderStandingsSection(rosters, currentLeagueSeason),
        isPlayoffs: true,
        showSeasonNav: true
    };
}

function applyState(state: PageState) {
    document.title = `Matchups | ${state.matchupsTitle}`;
    matchupsTitle.innerHTML = state.matchupsTitle;
    matchupsContent.innerHTML = state.contentHTML;
    standingsContainer.innerHTML = state.standingsHTML;
    leaguesSelect.value = state.leagueId;

    if (weeksSelect) {
        weeksSelect.value = state.weekValue.toString();
    }

    // Render or remove season navigation
    const existingNav = matchupsHeader.querySelector(".season-navigation");
    if (state.showSeasonNav) {
        if (!existingNav) {
            matchupsHeader.insertAdjacentHTML("beforeend", renderSeasonNav(state.isPlayoffs));
        } else {
            existingNav.querySelectorAll<HTMLButtonElement>(".nav-link").forEach(btn => {
                const view = btn.dataset.view;
                if ((view === "playoffs" && state.isPlayoffs) || (view === "regular" && !state.isPlayoffs)) {
                    btn.classList.add("active");
                } else {
                    btn.classList.remove("active");
                }
            });
        }
    } else {
        existingNav?.remove();
    }

    // Reattach event listeners for new dropdowns
    const newWeekSelect = document.querySelector<HTMLSelectElement>("#week-select");
    if (newWeekSelect) {
        newWeekSelect.addEventListener("change", onSelectChange);
    }
}

function renderSeasonNav(isPlayoffs: boolean): string {
    return `
        <nav class="season-navigation">
            <button class="btn nav-link ${!isPlayoffs ? 'active' : ''}" data-view="regular">Regular Season</button>
            <button class="btn nav-link ${isPlayoffs ? 'active' : ''}" data-view="playoffs">Playoffs</button>
        </nav>
    `;
}

function renderRegularSeasonView(matchups: Matchups, currentWeek: number): string {
    return `
        ${renderWeekSelect(currentWeek)}
        <section class="matchups-wrapper">
            ${matchups.map(renderMatchupCard).join("")}
        </section>
    `;
}

function renderPlayoffsView(brackets: PlayoffBrackets): string {
    return `
        <div class="bracket-tabs">
            <button class="btn tab-button active" data-bracket="winnersBracket">Winners</button>
            <button class="btn tab-button" data-bracket="losersBracket">Losers</button>
        </div>
        <section class="playoff-bracket">
            <div class="bracket-container active" data-bracket-type="winnersBracket">
                ${renderBracket(brackets.winnersBracket)}
            </div>
            <div class="bracket-container" data-bracket-type="losersBracket">
                ${renderBracket(brackets.losersBracket)}
            </div>
        </section>
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
        <div class="matchup-card" data-matchup-id="${matchup.bracketMatchupId}" data-week="${matchup.week}">
            <a class="matchup-card-link" href="#" role="button">
                ${renderPlayoffMatchupCardBody(matchup)}
            </a>
            ${renderPlayoffMatchupModal(matchup)}
        </div>
    `;
}

function renderPlayoffMatchupCardBody(matchup: PlayoffMatchup): string {
    const hasTeamName = (team: string | null, owner: string | null) => team || owner || "TBD";
    const imageURL = (teamImage: string | null, ownerImage: string, owner: string | null) => isTwistedTitTeas(owner) ? ownerImage : (teamImage ?? ownerImage);
    const t1Pts = parseFloat(matchup.t1Points) || 0;
    const t2Pts = parseFloat(matchup.t2Points) || 0;
    const resultClass = (rosterId: number | null, myPts: number, oppPts: number) =>
        matchup.winnerId != null ? (matchup.winnerId === rosterId ? "winner" : "loser") :
        myPts > oppPts ? "winner" : myPts < oppPts ? "loser" : "";

    return `
        <section class="home-team ${resultClass(matchup.t1RosterId, t1Pts, t2Pts)}">
            <img
                src="${imageURL(matchup.t1TeamImage, matchup.t1OwnerImage, matchup.t1Owner) || "https://placehold.co/50"}"
                alt="${escapeForHTML(hasTeamName(matchup.t1Team, matchup.t1Owner))} team logo"
                loading="lazy"
                decoding="async"
            />
            <div class="team-details">
                <h3>${escapeForHTML(hasTeamName(matchup.t1Team, matchup.t1Owner))}</h3>
                <p>${escapeForHTML(matchup.t1Points)}</p>
            </div>
        </section>
        <span class="vs">vs</span>
        <section class="away-team ${resultClass(matchup.t2RosterId, t2Pts, t1Pts)}">
            <img
                src="${imageURL(matchup.t2TeamImage, matchup.t2OwnerImage, matchup.t2Owner) || "https://placehold.co/50"}"
                alt="${escapeForHTML(hasTeamName(matchup.t2Team, matchup.t2Owner))} team logo"
                loading="lazy"
                decoding="async"
            />
            <div class="team-details">
                <h3>${escapeForHTML(hasTeamName(matchup.t2Team, matchup.t2Owner))}</h3>
                <p>${escapeForHTML(matchup.t2Points)}</p>
            </div>
        </section>
    `;
}

function renderPlayoffMatchupModal(matchup: PlayoffMatchup): string {
    return `
        <dialog class="matchup-modal">
            <button class="btn">Close</button>
            <section class="matchups-dialog-wrapper">
                <div class="matchup-card">
                    ${renderPlayoffMatchupCardBody(matchup)}
                </div>
                <div class="rosters-wrapper">
                    <div class="roster home-team-players">
                        ${renderPlayerList(matchup.t1StartingRoster, "Starting")}
                        ${renderPlayerList(matchup.t1BenchRoster, "Bench")}
                    </div>
                    <div class="roster away-team-players">
                        ${renderPlayerList(matchup.t2StartingRoster, "Starting")}
                        ${renderPlayerList(matchup.t2BenchRoster, "Bench")}
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
            src="${player.playerImage || "https://placehold.co/50"}"
            alt="${escapeForHTML(player.playerName)} headshot"
            loading="lazy"
            decoding="async"
        />
        <div class="player-info">
            <div class="player-name">${escapeForHTML(player.playerName)}</div>
            <div class="player-meta">
                <span class="player-position pos-${escapeForHTML(player.position?.toLowerCase() || "")}">
                    ${escapeForHTML(player.position)}
                </span>
                ${player.team ? `<span class="player-team">${escapeForHTML(player.team)}</span>` : ""}
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
    const imageURL = (t: MatchupRow) => isTwistedTitTeas(t.owner) ? t.ownerImage : (t.teamImage ?? t.ownerImage);
    const resultClass = (t1: MatchupRow, t2: MatchupRow) => { const a = parseFloat(t1.points) || 0; const b = parseFloat(t2.points) || 0; return a > b ? "winner" : a < b ? "loser" : ""; };

    return `
    <section class="home-team ${resultClass(home, away)}">
        <img
            src="${imageURL(home) || "https://placehold.co/50"}"
            alt="${escapeForHTML(teamName(home))} team logo"
            loading="lazy"
            decoding="async"
        />
        <div class="team-details">
            <h3>${escapeForHTML(teamName(home))}</h3>
            <p>${escapeForHTML(home.points)}</p>
        </div>
    </section>
    <span class="vs">vs</span>
    <section class="away-team ${resultClass(away, home)}">
        <img
            src="${imageURL(away) || "https://placehold.co/50"}"
            alt="${escapeForHTML(teamName(away))} team logo"
            loading="lazy"
            decoding="async"
        />
        <div class="team-details">
            <h3>${escapeForHTML(teamName(away))}</h3>
            <p>${escapeForHTML(away.points)}</p>
        </div>
    </section>
    `;
}

function renderMatchupModal([home, away]: MatchupTuple) {
    return `
    <dialog class="matchup-modal">
        <button class="btn">Close</button>
        <section class="matchups-dialog-wrapper">
            <div class="matchup-card">
                ${renderMatchupCardBody([home, away])}
            </div>
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
    <div class="matchup-card">
        <a class="matchup-card-link" href="#" role="button">
            ${renderMatchupCardBody(match)}
        </a>
        ${renderMatchupModal(match)}
    </div>
    `;
}

function renderStandingsSection(rosters: RostersRow[], season: string): string {
    return `
        <header>
            <h2>${escapeForHTML(season)} Regular Season Standings</h2>
        </header>
        <section id="standings-wrapper">
            <table>
                <caption>*Standings are based on Regular Season Head-to-Heads</caption>
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

    const imageURL = isTwistedTitTeas(team.ownerName) ? team.ownerImage : (team.teamImage ?? team.ownerImage);

    return `
    <tr>
        <th scope="row">
            <a class="standings-row-link" href="#" role="button">
                <img
                    src="${imageURL || "https://placehold.co/50"}"
                    alt="${escapeForHTML(displayName)} team logo"
                    loading="lazy"
                    decoding="async"
                />
                <span>${escapeForHTML(displayName)}</span>
            </a>
        </th>
        <td>${escapeForHTML(team.pointsFor.toString())}</td>
        <td>${escapeForHTML(team.pointsAgainst.toString())}</td>
        <td>${escapeForHTML(team.wins.toString())} / ${escapeForHTML(team.losses.toString())}</td>
        <td class="roster-modal-cell">
            <dialog class="rosters-modal">
                <button class="btn">Close</button>
                <section class="players-wrapper">
                    <header>
                        <img
                            src="${(isTwistedTitTeas(team.ownerName) ? team.ownerImage : (team.teamImage ?? team.ownerImage)) || "https://placehold.co/50"}"
                            alt="${escapeForHTML(displayName)} team logo"
                            loading="lazy"
                            decoding="async"
                        />
                        <h3>${escapeForHTML(displayName)}</h3>
                    </header>
                    <div class="roster">
                        ${renderPlayerList(team.startingRoster, "Starting")}
                        ${renderPlayerList(team.benchRoster, "Bench")}
                        ${renderPlayerList(team.reserveRoster, "Injured Reserve")}
                    </div>
                </section>
            </dialog>
        </td>
    </tr>
    `;
}