import { fetchJSON } from "./shared/lib.js";
import { iconCrown, iconSkull, iconFlame, iconTarget } from "./shared/icons.js";
import "./shared/nav.ts";

const challengerSelect = document.querySelector<HTMLSelectElement>('#challenger')!;
const opponentSelect = document.querySelector<HTMLSelectElement>('#opponent')!;
const battleBtn = document.querySelector<HTMLButtonElement>('#battle-btn')!;
const resultsContainer = document.querySelector<HTMLElement>('#rivalry-results')!;
const selects = [challengerSelect, opponentSelect];

selects.forEach(s => s.addEventListener('change', handleSelectChange));
battleBtn.addEventListener('click', handleBattle);

// Randomize avatar glow breathing delays so they don't pulse in sync
document.querySelectorAll<HTMLElement>('.team-select .team-avatar').forEach(avatar => {
    avatar.style.animationDelay = `${(Math.random() * 3).toFixed(2)}s`;
});

type MatchupRow = {
    week: number;
    season: string;
    matchupId: number | null;
    challengerRosterOwnerId: string;
    challengerTeamName: string;
    challengerUserAvatar: string | null;
    challengerTeamAvatar: string | null;
    challengerPoints: string;
    challengerOutcome: 'W' | 'L' | 'T' | 'BYE';
    opponentRosterOwnerId: string;
    opponentTeamName: string;
    opponentUserAvatar: string | null;
    opponentTeamAvatar: string | null;
    opponentPoints: string;
};

type RivalryData = {
    matchups: MatchupRow[];
    challengerTotal: string;
    opponentTotal: string;
    challengerWins: number;
    opponentWins: number;
    challengerHiscore: string;
    opponentHiscore: string;
    challengerLowScore: string;
    opponentLowScore: string;
    closestGame: string;
    blowoutGame: string;
    challengerAvgPoints: string;
    opponentAvgPoints: string;
    challengerWinAvg: number;
    opponentWinAvg: number;
};

// --- Select / battle handlers ---

function handleSelectChange(event: Event) {
    const changed = event.target as HTMLSelectElement;
    const other = selects.find(s => s !== changed)!;
    Array.from(other.options).forEach(opt => {
        if (opt.value !== 'select-team') opt.disabled = false;
    });
    other.querySelector<HTMLOptionElement>(`option[value="${changed.value}"]`)!.disabled = true;

    const container = changed.closest('.team-select')!;
    const placeholder = container.querySelector<HTMLImageElement>('.placeholder-avatar')!;
    const avatars = container.querySelectorAll<HTMLImageElement>('.team-avatar-option');

    placeholder.classList.add('hidden');
    avatars.forEach(i => i.classList.remove('active'));

    const selected = container.querySelector<HTMLImageElement>(`.team-avatar-option[data-user-id="${changed.value}"]`);
    if (selected) selected.classList.add('active');

    // tear down previous results when a selection changes
    resultsContainer.innerHTML = '';
    battleBtn.style.display = '';

    const bothSelected = selects.every(s => s.value !== 'select-team');
    battleBtn.disabled = !bothSelected;
    battleBtn.textContent = bothSelected ? 'BATTLE NOW!' : 'BATTLE';
    battleBtn.title = bothSelected ? '' : 'You must select both teams to begin a battle';
}

async function handleBattle() {
    const challenger = challengerSelect.value;
    const opponent = opponentSelect.value;

    battleBtn.disabled = true;

    try {
        const data = await fetchJSON<RivalryData>(
            `/api/web/rivalry-page/${challenger}/${opponent}`
        );

        if (!data || !data.matchups || data.matchups.length === 0) {
            resultsContainer.innerHTML =
                '<div class="empty-state"><p>No head-to-head matchups found between these teams.</p></div>';
            battleBtn.style.display = 'none';
            return;
        }

        renderRivalryResults(data);
        battleBtn.style.display = 'none';
    } catch (err) {
        console.error('Battle fetch failed:', err);
        resultsContainer.innerHTML =
            '<div class="empty-state"><p>Something went wrong loading rivalry data.</p></div>';
        battleBtn.disabled = false;
    }
}

// --- DOM helpers ---

function node(tag: string, className?: string, text?: string): HTMLElement {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined) n.textContent = text;
    return n;
}

// --- Battle flavor text ---

const BATTLE_QUOTES = [
    'Battle initiated. Pride at stake.',
    'Prepare the excuses.',
    'Oh, both these teams suck.',
    'Behold! The Mid-Off of the Century!',
    'Rivalry or charity event?',
    'Two frauds, one scoreboard.',
    'Mid recognizes mid.',
    'Two teams enter. The league laughs.',
    'Will we witness greatness? Absolutely not!',
    'One will win. Neither will impress.',
    'In this corner... disappointment! And in the other corner... also disappointment!',
    'Only one can win. Neither deserves it.'
];

function randomQuote(): string {
    return BATTLE_QUOTES[Math.floor(Math.random() * BATTLE_QUOTES.length)];
}

// --- Render: top-level ---

function randomizeAnimationDelays(container: HTMLElement) {
    // Randomize highlight card icon flicker delays so they don't sync
    container.querySelectorAll<HTMLElement>('.highlight-card svg').forEach(svg => {
        svg.style.animationDelay = `${(Math.random() * 4).toFixed(2)}s`;
        svg.style.animationDuration = `${(3 + Math.random() * 3).toFixed(2)}s`;
    });
}

function renderRivalryResults(data: RivalryData) {
    resultsContainer.innerHTML = '';

    resultsContainer.appendChild(renderBanner(`\u201C${randomQuote()}\u201D`));
    resultsContainer.appendChild(
        renderScoreboard(data.challengerWins, data.opponentWins, data.matchups.length, data.challengerWinAvg, data.opponentWinAvg)
    );
    resultsContainer.appendChild(renderBreakdown(data));
    resultsContainer.appendChild(renderHighlights(data));
    resultsContainer.appendChild(renderBattleHistory(data.matchups));

    randomizeAnimationDelays(resultsContainer);
}

// --- Render: banner ---

function renderBanner(text: string): HTMLElement {
    const wrapper = node('div', 'rivalry-banner');
    wrapper.appendChild(node('p', undefined, text));
    return wrapper;
}

// --- Render: scoreboard ---

function renderScoreboard(
    leftWins: number, rightWins: number, totalGames: number,
    leftPct: number, rightPct: number
): HTMLElement {
    const leftLeading = leftWins > rightWins;
    const rightLeading = rightWins > leftWins;

    const board = node('div', 'rivalry-scoreboard');
    const sides = node('div', 'scoreboard-sides');

    // Left
    const leftSide = node('div', 'scoreboard-side');
    if (leftLeading) leftSide.appendChild(iconCrown());
    leftSide.appendChild(node('div', `scoreboard-wins${leftLeading ? ' leading' : ''}`, String(leftWins)));
    leftSide.appendChild(node('div', 'scoreboard-label', 'WINS'));

    // Divider
    const divider = node('div', 'scoreboard-divider');
    divider.appendChild(node('div', 'scoreboard-dash', '-'));
    divider.appendChild(node('div', 'scoreboard-games', `${totalGames} GAMES`));

    // Right
    const rightSide = node('div', 'scoreboard-side');
    if (rightLeading) rightSide.appendChild(iconCrown());
    rightSide.appendChild(node('div', `scoreboard-wins${rightLeading ? ' leading' : ''}`, String(rightWins)));
    rightSide.appendChild(node('div', 'scoreboard-label', 'WINS'));

    sides.appendChild(leftSide);
    sides.appendChild(divider);
    sides.appendChild(rightSide);
    board.appendChild(sides);

    // Win % bar
    const bar = node('div', 'scoreboard-bar');
    const track = node('div', 'scoreboard-bar-track');
    const tied = leftWins === rightWins;
    const barLeft = node('div', `scoreboard-bar-left ${leftLeading || tied ? 'bar-winner' : 'bar-loser'}`);
    barLeft.style.width = `${leftPct}%`;
    const barRight = node('div', `scoreboard-bar-right ${rightLeading ? 'bar-winner' : 'bar-loser'}`);
    barRight.style.width = `${rightPct}%`;
    track.appendChild(barLeft);
    track.appendChild(barRight);
    bar.appendChild(track);
    board.appendChild(bar);

    return board;
}

// --- Render: head-to-head breakdown ---

function renderStatRow(
    leftValue: string, label: string, rightValue: string,
    leftLeads: boolean, rightLeads: boolean
): HTMLElement {
    const row = node('div', 'rivalry-stat-row');

    const left = node('div', `stat-left${leftLeads ? ' leading' : ''}`);
    left.appendChild(node('span', undefined, leftValue));

    const mid = node('div', 'stat-label');
    mid.appendChild(node('span', undefined, label));

    const right = node('div', `stat-right${rightLeads ? ' leading' : ''}`);
    right.appendChild(node('span', undefined, rightValue));

    row.appendChild(left);
    row.appendChild(mid);
    row.appendChild(right);
    return row;
}

function renderBreakdown(data: RivalryData): HTMLElement {
    const wrapper = node('div', 'rivalry-breakdown');
    wrapper.appendChild(node('h3', undefined, 'Head-to-Head Breakdown'));

    const rows = node('div', 'breakdown-rows');
    const stats = [
        { left: data.challengerTotal, label: 'Total Points', right: data.opponentTotal },
        { left: data.challengerAvgPoints, label: 'Avg Points', right: data.opponentAvgPoints },
        { left: data.challengerHiscore, label: 'High Score', right: data.opponentHiscore },
        { left: data.challengerLowScore, label: 'Low Score', right: data.opponentLowScore },
        { left: `${data.challengerWinAvg}%`, label: 'Win %', right: `${data.opponentWinAvg}%` },
    ];

    for (const s of stats) {
        const lv = parseFloat(s.left);
        const rv = parseFloat(s.right);
        const isLow = s.label === 'Low Score';
        rows.appendChild(renderStatRow(
            s.left, s.label, s.right,
            isLow ? lv < rv : lv > rv,
            isLow ? rv < lv : rv > lv,
        ));
    }

    wrapper.appendChild(rows);
    return wrapper;
}

// --- Render: highlight cards ---

function renderHighlightCard(
    iconFn: () => SVGSVGElement, label: string, value: string,
    description: string, detail: string, accentClass: string
): HTMLElement {
    const card = node('div', `highlight-card ${accentClass}`);
    card.appendChild(iconFn());
    card.appendChild(node('div', 'highlight-label', label));
    card.appendChild(node('div', 'highlight-value', value));
    card.appendChild(node('div', 'highlight-description', description));
    if (detail) card.appendChild(node('div', 'highlight-detail', detail));
    return card;
}

function renderHighlights(data: RivalryData): HTMLElement {
    const grid = node('div', 'highlights-grid');
    const totalGames = data.matchups.length;
    const combined = (parseFloat(data.challengerTotal) + parseFloat(data.opponentTotal)).toFixed(2);
    const avgPerGame = ((parseFloat(data.challengerTotal) + parseFloat(data.opponentTotal)) / totalGames).toFixed(2);

    grid.appendChild(renderHighlightCard(
        iconSkull, 'Biggest Blowout', `${data.blowoutGame} pts`,
        'Margin of victory', '', 'highlight-purple'
    ));
    grid.appendChild(renderHighlightCard(
        iconFlame, 'Closest Nail-Biter', `${data.closestGame} pts`,
        'Narrowest margin', '', 'highlight-orange'
    ));
    grid.appendChild(renderHighlightCard(
        iconTarget, 'Combined Points', combined,
        `Across ${totalGames} epic battles`,
        `Avg: ${avgPerGame} per game`, 'highlight-emerald'
    ));

    return grid;
}

// --- Render: battle history ---

function renderMatchRow(match: MatchupRow): HTMLElement {
    const row = node('div', 'match-row');
    const result = match.challengerOutcome;

    // Meta
    const meta = node('div', 'match-meta');
    meta.appendChild(node('div', 'match-season', match.season));
    meta.appendChild(node('div', 'match-week', `Wk ${match.week}`));

    // Scores
    const scores = node('div', 'match-scores');

    const leftScore = node('div', `match-score${result === 'W' ? ' winner' : ''}`);
    leftScore.appendChild(node('span', undefined, match.challengerPoints));

    scores.appendChild(leftScore);
    scores.appendChild(node('span', 'match-vs', 'vs'));

    const rightScore = node('div', `match-score${result === 'L' ? ' winner' : ''}`);
    rightScore.appendChild(node('span', undefined, match.opponentPoints));

    scores.appendChild(rightScore);

    // Result badge
    const resultEl = node('div', 'match-result');
    resultEl.appendChild(node('span', result === 'W' ? 'result-win' : 'result-loss', result));

    row.appendChild(meta);
    row.appendChild(scores);
    row.appendChild(resultEl);
    return row;
}

function renderBattleHistory(matchups: MatchupRow[]): HTMLElement {
    const wrapper = node('div', 'battle-history');

    const header = node('div', 'battle-history-header');
    header.appendChild(node('h3', undefined, 'Battle History'));
    wrapper.appendChild(header);

    const list = node('div', 'battle-history-list');
    for (const match of matchups) {
        list.appendChild(renderMatchRow(match));
    }
    wrapper.appendChild(list);

    return wrapper;
}
