console.log("I'm just here so I don't get fined.");

const matchupsWrapper = document.getElementById('matchups-wrapper');
const leaguesSelect = document.querySelector<HTMLSelectElement>('#league-select');
const weeksSelect = document.querySelector<HTMLSelectElement>('#week-select');

type MatchupsResponse = {
    matchups: MatchupTuple[];
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

leaguesSelect?.addEventListener("change", async function () {
    const leagueId = this.value;
    const weekValue = weeksSelect?.value;
    // location.href = location.origin + `/matchups/leagues/${leagueId}/weeks/${weekValue}`;
    const resourceURL = `/api/matchups/leagues/${leagueId}/weeaks/${weekValue}`;
    const { matchups } = await fetchJSON<MatchupsResponse>(resourceURL);

    renderMatchupsSection(matchups);
});

weeksSelect?.addEventListener("change", function () {
    const leagueId = leaguesSelect?.value;
    const weekValue = this.value;
    location.href = location.origin + `/matchups/leagues/${leagueId}/weeks/${weekValue}`;
});

function renderMatchupsSection(matchups: MatchupTuple[]) {
    let html = "";
    matchups.forEach(matchup => html += renderMatchupCard(matchup));
    matchupsWrapper!.innerHTML = html;
}

function renderMatchupCard(matchup: MatchupTuple) {
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

function hasTeamName(t: MatchupRow) {
    return t.team ? t.team : t.owner;
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
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}