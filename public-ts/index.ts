console.log("I'm just here so I don't get fined.");

const matchupsWrapper = document.getElementById("matchups-wrapper")!;
const leaguesSelect = document.querySelector<HTMLSelectElement>("#league-select")!;
const weeksSelect = document.querySelector<HTMLSelectElement>("#week-select")!;

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
    leagueId: string;
    weekValue: string;
    matchupsHTML: string;
};

window.addEventListener("DOMContentLoaded", () => {
    const initialState: PageState = {
        leagueId: leaguesSelect.value,
        weekValue: weeksSelect.value,
        matchupsHTML: matchupsWrapper.innerHTML
    };

    history.replaceState(initialState, "", location.href);
});

window.addEventListener("popstate", (event) => {
    const state = event.state as PageState | null;
    if (!state) return;

    applyState(state);
});


leaguesSelect.addEventListener("change", onSelectChange);
weeksSelect.addEventListener("change", onSelectChange);

async function onSelectChange() {
    const leagueId = leaguesSelect.value;
    const weekValue = weeksSelect.value;

    const apiURL = `/api/matchups/leagues/${leagueId}/weeks/${weekValue}`;
    const pageURL = `/matchups/leagues/${leagueId}/weeks/${weekValue}`;

    const { matchups } = await fetchJSON<MatchupsResponse>(apiURL);

    const html = matchups.map(renderMatchupCard).join("");

    const state: PageState = {
        leagueId,
        weekValue,
        matchupsHTML: html
    };

    history.pushState(state, "", pageURL);
    applyState(state);
}

function applyState(state: PageState) {
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
        </div>
    `;
}

async function fetchJSON<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} at ${url}`);
    return await res.json();
}

function escapeHTML(str: string) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}
