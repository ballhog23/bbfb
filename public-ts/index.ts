import {
    fetchJSON, escapeForHTML, findNearestElement
} from "./lib.js";
console.log("I'm just here so I don't get fined");

const matchupsWrapper = document.getElementById("matchups-wrapper")!;
const leaguesSelect = document.querySelector<HTMLSelectElement>("#league-select")!;
const weeksSelect = document.querySelector<HTMLSelectElement>("#week-select")!;
const matchupsTitle = document.querySelector(".matchups-container header h2")!;
const standingsTableBody = document.querySelector(".standings-container table tbody")!;
const standingsTitle = document.querySelector(".standings-container header h2")!;

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
    rosterPlayers: {
        playerName: string;
        position: string;
        points: string;
        starter: boolean;
    }[];
};
type MatchupTuple = [MatchupRow, MatchupRow];
type RostersRow = {
    userId: string;
    ownerName: string;
    teamName: string;
    season: string;
    wins: number;
    losses: number;
    players: {
        starter: boolean;
        position: string;
        playerName: string;
    }[];
};
type RegularSeasonStandingsRow = {
    userId: string;
    ownerName: string;
    teamName: string | null;
    pointsFor: string;
    pointsAgainst: string;
    wins: number;
    losses: number;
    roster: RostersRow["players"];
};
type MatchupsPageResponse = {
    allLeagues: LeagueData[];
    currentLeagueId: string;
    currentLeagueSeason: string;
    currentWeek: number;
    matchups: MatchupTuple[];
    standingsRows: RegularSeasonStandingsRow[];
};

type PageState = {
    matchupsTitle: string;
    leagueId: string;
    weekValue: string;
    matchupsHTML: string;
    standingsTitle: string;
    standingsHTML: string;
};
type MatchupCard = HTMLDivElement;
type MatchupModal = HTMLDialogElement;
type PlayersWrapper = HTMLDivElement;

window.addEventListener("DOMContentLoaded", (event) => {
    const initialState: PageState = {
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
    const state = event.state as PageState | null;
    if (!state) return;
    applyState(state);
});

window.addEventListener("click", (event) => {
    const clickedCard = findNearestElement<MatchupCard>(event, '.matchup-card');
    const clickedDialog = findNearestElement<MatchupModal>(event, 'dialog');
    const clickedStandingsRow = findNearestElement(event, 'tbody tr');

    if (!clickedCard && !clickedDialog && !clickedStandingsRow) return;

    // Card 
    if (clickedCard && !clickedDialog && !clickedStandingsRow) {
        const dialog = clickedCard.querySelector<MatchupModal>('dialog')!;
        dialog.showModal();
    }

    // Dialog
    if (clickedDialog) {
        const clickedPlayersWrapper = findNearestElement<PlayersWrapper>(event, '.matchups-dialog-wrapper');

        if (!clickedPlayersWrapper) {
            clickedDialog.close();
        }
        return;
    }

    // Standings Table Row
    if (clickedStandingsRow) {
        const dialog = clickedStandingsRow.querySelector('dialog')!;
        dialog.showModal();
    }
});

leaguesSelect.addEventListener("change", onSelectChange);
weeksSelect.addEventListener("change", onSelectChange);

async function onSelectChange() {
    const leagueId = leaguesSelect.value;
    const leagueSeasonOption = leaguesSelect.querySelector<HTMLOptionElement>(`[value='${leagueId}']`)!;
    const weekValue = weeksSelect.value;
    const weekOption = weeksSelect.querySelector<HTMLOptionElement>(`[value='${weekValue}']`)!;

    const apiURL = `/api/matchups-page/leagues/${leagueId}/weeks/${weekValue}`;
    const pageURL = `/matchups/leagues/${leagueId}/weeks/${weekValue}`;
    const pageData = await fetchJSON<MatchupsPageResponse>(apiURL);
    const { matchups, standingsRows } = pageData;

    const matchupsHTML = matchups.map(renderMatchupCard).join("");
    const matchupsTitle = `Season ${leagueSeasonOption.innerText} - ${weekOption.innerText}`;
    const standingsHTML = standingsRows.map(renderStandingsTableRowHTML).join("");
    const standingsTitle = `${leagueSeasonOption.innerText} Regular Season Standings`;
    const state: PageState = {
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

function applyState(state: PageState) {
    matchupsTitle.innerHTML = state.matchupsTitle;
    matchupsWrapper.innerHTML = state.matchupsHTML;
    leaguesSelect.value = state.leagueId;
    weeksSelect.value = state.weekValue;
    standingsTitle.innerHTML = state.standingsTitle;
    standingsTableBody.innerHTML = state.standingsHTML;
}

function renderMatchupCardBase([away, home]: MatchupTuple) {
    return `
            <div class="home-team">
                <h3>${escapeForHTML(home.team ?? home.owner)}</h3>
                <p>${escapeForHTML(home.points)}</p>
            </div>
            <span>vs</span>
            <div class="away-team">
                <h3>${escapeForHTML(away.team ?? away.owner)}</h3>
                <p>${escapeForHTML(away.points)}</p>
            </div>
            `;
}

function renderMatchupCard([away, home]: MatchupTuple) {
    return `
            <article class="matchup-card">
                ${renderMatchupCardBase([away, home])}
                <dialog class="matchup-modal">
                    <button>Close</button>
                    <section class="matchups-dialog-wrapper">
                        <article class="matchup-card">
                            ${renderMatchupCardBase([away, home])}
                        </article>
                        <div class="rosters-wrapper">
                            <div class="roster home-team-players">
                                ${renderPlayersHTML(home.rosterPlayers)}
                            </div>
                            <div class="roster away-team-players">
                                ${renderPlayersHTML(away.rosterPlayers)}
                            </div>
                        </div>
                    </section>
                </dialog>
            </article>
    `;
}

function renderPlayersHTML(players: MatchupRow['rosterPlayers']) {
    const html = players.map(
        player =>
            `<p>${escapeForHTML(player.position)}</p>` +
            `<p>${escapeForHTML(player.playerName)}</p>` +
            `<p>${escapeForHTML(player.points)}</p>` +
            `<p>${escapeForHTML(player.starter ? "true" : "false")}</p>`

    ).join('');

    return html;
}

function renderStandingsTableRowHTML(team: RegularSeasonStandingsRow) {
    return `
        <tr>
            <th scope="row">${escapeForHTML(team.teamName ?? team.ownerName)}</th>
            <td>${escapeForHTML(team.pointsFor)}</td>
            <td>${escapeForHTML(team.pointsAgainst)}</td>
            <td>${escapeForHTML(team.wins)}/${escapeForHTML(team.losses)}</td>
            <td class="roster-modal-cell">
                <dialog class="matchup-modal rosters-modal">
                    <button>Close</button>
                        <div class="players-wrapper">
                            <h3>${escapeForHTML(team.teamName ?? team.ownerName)}</h3>
                            ${renderRosterPlayersHTML(team.roster)}
                        </div>
                </dialog>
            </td>
        </tr>
    `;
}

function renderRosterPlayersHTML(players: RegularSeasonStandingsRow["roster"]) {
    const html = players.map(player =>
        `
            <p>${escapeForHTML(player.position)}</p>
            <p>${escapeForHTML(player.playerName)}</p>
            <p>${escapeForHTML(player.starter ? "true" : "false")}</p>
        `
    ).join('');

    return html;
}