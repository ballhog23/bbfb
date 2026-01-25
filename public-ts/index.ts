console.log("I'm just here so I don't get fined.");

const matchupsWrapper = document.getElementById("matchups-wrapper")!;
const leaguesSelect = document.querySelector<HTMLSelectElement>("#league-select")!;
const weeksSelect = document.querySelector<HTMLSelectElement>("#week-select")!;
const pageTitle = document.querySelector('h1')!;

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

type MatchupsResponse = {
    matchups: MatchupTuple[];
};

type PageState = {
    pageTitle: string;
    leagueId: string;
    weekValue: string;
    matchupsHTML: string;
};

type MatchupCard = HTMLDivElement;
type MatchupModal = HTMLDialogElement;
type PlayersWrapper = HTMLDivElement;

window.addEventListener("DOMContentLoaded", (event) => {
    const initialState: PageState = {
        pageTitle: pageTitle.innerHTML,
        leagueId: leaguesSelect.value,
        weekValue: weeksSelect.value,
        matchupsHTML: matchupsWrapper.innerHTML
    };

    history.replaceState(initialState, "", location.href);
});

window.addEventListener("popstate", (event) => {
    const state = event.state as PageState | null;
    if (!state) return;
    console.log('popstate', state.pageTitle);
    applyState(state);
});

window.addEventListener("click", (event) => {
    const clickedCard = findNearestElement<HTMLDivElement>(event, '.matchup-card');
    const clickedDialog = findNearestElement<HTMLDialogElement>(event, '.matchup-modal');

    if (!clickedCard && !clickedDialog) return;

    // Card 
    if (clickedCard && !clickedDialog) {
        const dialog = clickedCard.querySelector<HTMLDialogElement>('dialog')!;
        dialog.showModal();
    }

    // Dialog
    if (clickedDialog) {
        const clickedPlayersWrapper = findNearestElement<HTMLDivElement>(event, '.players-wrapper');

        if (!clickedPlayersWrapper) {
            clickedDialog.close();
        }
    }
});

function findNearestElement<T extends HTMLElement = HTMLElement>(
    event: PointerEvent,
    selector: string
): T | null {
    const target = event.target as Element | null;
    if (!target) return null;
    return target.closest(selector) as T | null;
}

leaguesSelect.addEventListener("change", onSelectChange);
weeksSelect.addEventListener("change", onSelectChange);

// we could use memoization and store response in memory to eliminate re-fetching of data
async function onSelectChange() {
    const leagueId = leaguesSelect.value;
    const leagueSeasonOption = leaguesSelect.querySelector<HTMLOptionElement>(`[value='${leagueId}']`)!;
    const weekValue = weeksSelect.value;
    const weekOption = weeksSelect.querySelector<HTMLOptionElement>(`[value='${weekValue}']`)!;

    const apiURL = `/api/matchups/leagues/${leagueId}/weeks/${weekValue}`;
    const pageURL = `/matchups/leagues/${leagueId}/weeks/${weekValue}`;

    const { matchups } = await fetchJSON<MatchupsResponse>(apiURL);

    const matchupsHTML = matchups.map(renderMatchupCard).join("");
    const pageTitle = `Season ${leagueSeasonOption.innerText} - ${weekOption.innerText}`;

    const state: PageState = {
        pageTitle,
        leagueId,
        weekValue,
        matchupsHTML,
    };

    history.pushState(state, "", pageURL);
    applyState(state);
}

function applyState(state: PageState) {
    pageTitle.innerHTML = state.pageTitle;
    matchupsWrapper.innerHTML = state.matchupsHTML;
    leaguesSelect.value = state.leagueId;
    weeksSelect.value = state.weekValue;
}

function renderMatchupCard([away, home]: MatchupTuple) {
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
            <dialog class="matchup-modal">
                <button>Close</button>
                <div class="players-wrapper">
                    <div class="home-team-players">
                        ${renderPlayersHTML(home.rosterPlayers)}
                    </div>
                    <div class="away-team-players">
                        ${renderPlayersHTML(away.rosterPlayers)}
                    </div>
                </div>
        </div>
    `;
}

function renderPlayersHTML(players: MatchupRow['rosterPlayers']) {
    const html = players.map(
        player =>
            `<p>${escapeHTML(player.position)}</p>` +
            `<p>${escapeHTML(player.playerName)}</p>` +
            `<p>${escapeHTML(player.points)}</p>` +
            `<p>${escapeHTML(player.starter ? "true" : "false")}</p>`

    ).join('');

    return html;
}

async function fetchJSON<T>(url: string): Promise<T> {
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

function escapeHTML(str: string) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}
