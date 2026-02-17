import { fetchJSON } from "./shared/lib.js";
import "./shared/nav.ts";

const tabs = document.querySelectorAll<HTMLButtonElement>('.stats-tab');
const content = document.querySelector<HTMLElement>('#stats-content')!;
const leagueSelect = document.querySelector<HTMLSelectElement>('#stats-league-select')!;
const leagueSelectWrapper = document.querySelector<HTMLElement>('.league-select-wrapper')!;

type StatsData = {
    bigNumbers: { totalPts: string; totalGames: string; avgPts: string };
    scoringRecords: Record<string, string>;
    pointMargins: Record<string, string>;
    leaderboard: Record<string, string>;
    streaks: Record<string, string>;
    thatsGottaHurt: Record<string, string>;
};

type AllTimeResponse = { stats: StatsData };

type SeasonResponse = {
    stats: StatsData;
    allLeagues: { leagueId: string; season: string }[];
    currentLeagueId: string;
    currentSeason: string;
};

type PageState = {
    activeTab: 'all-time' | 'season';
    leagueId: string;
    contentHTML: string;
    showLeagueSelect: boolean;
};

// ── Initialize state from SSR ──
const isSeasonView = content.dataset.isSeasonView === 'true';
const initialLeagueId = content.dataset.currentLeagueId || '';

const initialState: PageState = {
    activeTab: isSeasonView ? 'season' : 'all-time',
    leagueId: initialLeagueId,
    contentHTML: content.innerHTML,
    showLeagueSelect: isSeasonView,
};

window.addEventListener("DOMContentLoaded", () => {
    history.replaceState(initialState, "", location.href);
});

window.addEventListener("popstate", (event) => {
    const state = event.state as PageState | null;
    if (!state) return;
    applyState(state);
});

// ── Tab switching ──
tabs.forEach(tab => {
    tab.addEventListener('click', () => handleTabChange(tab));
});

async function handleTabChange(tab: HTMLButtonElement) {
    const newTab = tab.dataset.tab as 'all-time' | 'season';
    const currentState = history.state as PageState | null;
    if (newTab === currentState?.activeTab) return;

    tabs.forEach(t => t.classList.toggle('active', t === tab));

    if (newTab === 'all-time') {
        await loadAllTimeStats();
    } else {
        const leagueId = leagueSelect.value;
        if (leagueId) {
            await loadSeasonStats(leagueId);
        }
    }
}

// ── League select ──
leagueSelect?.addEventListener("change", async () => {
    const leagueId = leagueSelect.value;
    if (leagueId) {
        await loadSeasonStats(leagueId);
    }
});

// ── Data loading ──
async function loadAllTimeStats() {
    try {
        const data = await fetchJSON<AllTimeResponse>(
            '/api/web/league-stats-page/all-time'
        );
        const pageURL = '/league-stats';

        const state: PageState = {
            activeTab: 'all-time',
            leagueId: '',
            contentHTML: renderAllTimeStats(data.stats),
            showLeagueSelect: false,
        };

        history.pushState(state, "", pageURL);
        applyState(state);
    } catch (err) {
        console.error('Failed to load all-time stats:', err);
        content.innerHTML = '<p class="stats-error">Failed to load stats data.</p>';
    }
}

async function loadSeasonStats(leagueId: string) {
    try {
        const data = await fetchJSON<SeasonResponse>(
            `/api/web/league-stats-page/leagues/${leagueId}`
        );
        const pageURL = `/league-stats/leagues/${leagueId}`;

        const state: PageState = {
            activeTab: 'season',
            leagueId: data.currentLeagueId,
            contentHTML: renderSeasonStats(data.stats, data.currentSeason),
            showLeagueSelect: true,
        };

        history.pushState(state, "", pageURL);
        applyState(state);
    } catch (err) {
        console.error('Failed to load season stats:', err);
        content.innerHTML = '<p class="stats-error">Failed to load season stats.</p>';
    }
}

// ── State management ──
function applyState(state: PageState) {
    content.innerHTML = state.contentHTML;

    tabs.forEach(t => {
        t.classList.toggle('active', t.dataset.tab === state.activeTab);
    });

    leagueSelectWrapper.classList.toggle('hidden', !state.showLeagueSelect);

    if (state.leagueId && leagueSelect) {
        leagueSelect.value = state.leagueId;
    }

    document.title = state.activeTab === 'all-time'
        ? 'Hall of Stats & Laughs'
        : `Stats - Season Snapshot`;
}

// ---------- rendering helpers ----------

type CardProps = {
    title: string;
    icon: string;
    value: string | number;
    desc: string;
    roast: string;
    variant: 'primary' | 'secondary' | 'destructive' | 'default';
};

function svgIcon(name: string): string {
    const icons: Record<string, string> = {
        'trophy': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
        'target': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
        'trending-up': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
        'trending-down': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>',
        'flame': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
        'zap': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>',
        'skull': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="M240-80v-170q-39-17-68.5-45.5t-50-64.5q-20.5-36-31-77T80-520q0-158 112-259t288-101q176 0 288 101t112 259q0 42-10.5 83t-31 77q-20.5 36-50 64.5T720-250v170H240Zm80-80h40v-80h80v80h80v-80h80v80h40v-142q38-9 67.5-30t50-50q20.5-29 31.5-64t11-74q0-125-88.5-202.5T480-800q-143 0-231.5 77.5T160-520q0 39 11 74t31.5 64q20.5 29 50.5 50t67 30v142Zm100-200h120l-60-120-60 120Zm-80-80q33 0 56.5-23.5T420-520q0-33-23.5-56.5T340-600q-33 0-56.5 23.5T260-520q0 33 23.5 56.5T340-440Zm280 0q33 0 56.5-23.5T700-520q0-33-23.5-56.5T620-600q-33 0-56.5 23.5T540-520q0 33 23.5 56.5T620-440ZM480-160Z"/></svg>',
        'crown': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/></svg>',
        'star': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>',
    };
    return icons[name] || '';
}

function esc(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function renderCard(card: CardProps): string {
    return `
        <div class="stats-card stats-card--${esc(card.variant || 'default')}">
            <div class="stats-card__header">
                <span class="stats-card__title">${esc(card.title)}</span>
                <div class="stats-card__icon">${svgIcon(card.icon)}</div>
            </div>
            <div class="stats-card__body">
                <span class="stats-card__value">${esc(String(card.value))}</span>
                <p class="stats-card__desc">${esc(card.desc)}</p>
                <p class="stats-card__roast">${esc(card.roast)}</p>
            </div>
        </div>`;
}

function renderSection(icon: string, title: string, subtitle: string, cards: CardProps[]): string {
    return `
        <section class="stats-section">
            <div class="section-header">
                <div class="section-header__icon">${svgIcon(icon)}</div>
                <div class="section-header__text">
                    <h2>${esc(title)}</h2>
                    <p>${esc(subtitle)}</p>
                </div>
            </div>
            <div class="stats-grid">
                ${cards.map(renderCard).join('')}
            </div>
        </section>`;
}

function renderAllTimeStats(s: StatsData): string {
    const sr = s.scoringRecords;
    const pm = s.pointMargins;
    const st = s.streaks;
    const lb = s.leaderboard;
    const tgh = s.thatsGottaHurt;

    return [
        renderSection('trophy', 'The Big Numbers', 'The all-time ledger of fantasy dominance', [
            {
                title: 'Total Points Scored',
                icon: 'target',
                value: s.bigNumbers.totalPts,
                desc: 'Every point, every season, every heartbreak',
                roast: 'The collective output of years of questionable decisions',
                variant: 'primary',
            },
            {
                title: 'Total Games Played',
                icon: 'trophy',
                value: s.bigNumbers.totalGames,
                desc: 'Across every season in league history',
                roast: "That's a lot of Sundays sacrificed",
                variant: 'default',
            },
            {
                title: 'All-Time Avg PPG',
                icon: 'trending-up',
                value: s.bigNumbers.avgPts,
                desc: 'The historical baseline for fantasy output',
                roast: 'The number that separates contenders from pretenders',
                variant: 'secondary',
            },
        ]),
        renderSection('flame', 'Scoring Records', 'The all-time highs, lows, and "how did that happen?" moments', [
            {
                title: 'Most Points in a Game',
                icon: 'trending-up',
                value: sr.mostPtsValue,
                desc: `${sr.mostPtsTeamName} — Week ${sr.mostPtsWeek}, ${sr.mostPtsSeason}`,
                roast: 'They woke up and chose violence',
                variant: 'primary',
            },
            {
                title: 'Fewest Points in a Game',
                icon: 'trending-down',
                value: sr.fewestPtsValue ?? '0',
                desc: `${sr.fewestPtsTeamName} — Week ${sr.fewestPtsWeek}, ${sr.fewestPtsSeason}`,
                roast: 'Did they even set a lineup?',
                variant: 'destructive',
            },
            {
                title: 'Fewest Points in a Win',
                icon: 'crown',
                value: sr.fewestPtsInWinValue ?? '0',
                desc: `${sr.fewestPtsInWinTeamName} — Week ${sr.fewestPtsInWinWeek}, ${sr.fewestPtsInWinSeason}`,
                roast: 'Lucky to be alive',
                variant: 'secondary',
            },
            {
                title: 'Highest Combined Matchup',
                icon: 'zap',
                value: sr.highestCombinedValue,
                desc: `${sr.highestCombinedT1Name} vs ${sr.highestCombinedT2Name} — Week ${sr.highestCombinedWeek}, ${sr.highestCombinedSeason}`,
                roast: 'Both teams chose violence',
                variant: 'primary',
            },
            {
                title: 'Lowest Combined Matchup',
                icon: 'target',
                value: sr.lowestCombinedValue,
                desc: `${sr.lowestCombinedT1Name} vs ${sr.lowestCombinedT2Name} — Week ${sr.lowestCombinedWeek}, ${sr.lowestCombinedSeason}`,
                roast: 'Nobody showed up. Across all of history, this was the worst.',
                variant: 'default',
            },
        ]),
        renderSection('zap', 'Point Margins', 'Every blowout and nail-biter across league history', [
            {
                title: 'Largest Margin of Victory',
                icon: 'zap',
                value: pm.largestMarginValue,
                desc: `${pm.largestMarginT1Name} vs ${pm.largestMarginT2Name} — Week ${pm.largestMarginWeek}, ${pm.largestMarginSeason}`,
                roast: "That's a blowout for the ages",
                variant: 'primary',
            },
            {
                title: 'Smallest Margin of Victory',
                icon: 'target',
                value: pm.smallestMarginValue,
                desc: `${pm.smallestMarginT1Name} vs ${pm.smallestMarginT2Name} — Week ${pm.smallestMarginWeek}, ${pm.smallestMarginSeason}`,
                roast: 'Monday night nightmares are made of margins like this',
                variant: 'secondary',
            },
            {
                title: 'Games Decided by < 1 pt',
                icon: 'flame',
                value: pm.gamesUnder1pt,
                desc: 'Decimal point drama across all seasons',
                roast: 'Every one of these caused a Monday morning meltdown',
                variant: 'destructive',
            },
            {
                title: 'Avg Margin of Victory',
                icon: 'trending-up',
                value: pm.avgMargin,
                desc: 'Average margin across all games in league history',
                roast: 'The comfort zone of victory, quantified for all time',
                variant: 'primary',
            },
            {
                title: 'Blowout Rate (20+ pts)',
                icon: 'zap',
                value: `${pm.blowoutRate}%`,
                desc: 'All-time annihilation rate',
                roast: 'The percentage of games where mercy should have been shown',
                variant: 'default',
            },
        ]),
        renderSection('flame', 'The Streaks', 'The longest runs of glory and despair in league history', [
            {
                title: 'Longest Winning Streak',
                icon: 'trending-up',
                value: `${st.winStreakLength}W`,
                desc: `${st.winStreakTeamName} — ${st.winStreakSeason}`,
                roast: 'Riding high across seasons',
                variant: 'secondary',
            },
            {
                title: 'Longest Losing Streak',
                icon: 'trending-down',
                value: `${st.lossStreakLength}L`,
                desc: `${st.lossStreakTeamName} — ${st.lossStreakSeason}`,
                roast: 'We learn from these... right?',
                variant: 'destructive',
            },
        ]),
        renderSection('star', 'All-Time Leaderboard', 'The legends atop the all-time mountain', [
            {
                title: 'All-Time Points Leader',
                icon: 'crown',
                value: lb.ptsLeaderValue,
                desc: lb.ptsLeaderName,
                roast: 'Volume over everything',
                variant: 'primary',
            },
            {
                title: 'Most All-Time Wins',
                icon: 'trophy',
                value: lb.mostWinsValue,
                desc: lb.mostWinsName,
                roast: 'Stacking Ws across eras',
                variant: 'secondary',
            },
            {
                title: 'Most All-Time Losses',
                icon: 'skull',
                value: lb.mostLossesValue,
                desc: lb.mostLossesName,
                roast: 'Longevity has its downsides',
                variant: 'destructive',
            },
            {
                title: 'Most Weekly Top Scores',
                icon: 'crown',
                value: lb.mostTopScoresValue,
                desc: lb.mostTopScoresName,
                roast: 'Consistency is king',
                variant: 'primary',
            },
        ]),
        renderSection('skull', "That's Gotta Hurt", 'The universe has had a sick sense of humor since day one', [
            {
                title: 'Most Points in a Loss',
                icon: 'skull',
                value: tgh.mostPtsInLossValue ?? '0',
                desc: `${tgh.mostPtsInLossTeamName} — Week ${tgh.mostPtsInLossWeek}, ${tgh.mostPtsInLossSeason}`,
                roast: 'Wrong place, wrong time',
                variant: 'destructive',
            },
            {
                title: 'Most Points Faced (All-Time)',
                icon: 'target',
                value: tgh.mostPointsFacedValue,
                desc: tgh.mostPointsFacedName,
                roast: 'Schedule from hell, lifetime edition',
                variant: 'destructive',
            },
            {
                title: 'Most Weekly Last Places',
                icon: 'skull',
                value: tgh.mostLastPlacesValue,
                desc: tgh.mostLastPlacesName,
                roast: 'Somebody has to hold the floor down',
                variant: 'destructive',
            },
        ]),
    ].join('');
}

function renderSeasonStats(s: StatsData, season: string): string {
    const sr = s.scoringRecords;
    const pm = s.pointMargins;
    const st = s.streaks;
    const lb = s.leaderboard;
    const tgh = s.thatsGottaHurt;

    return [
        renderSection('trophy', 'The Big Numbers', `The ${season} season by the numbers`, [
            {
                title: 'Total Points Scored',
                icon: 'target',
                value: s.bigNumbers.totalPts,
                desc: `Every point scored in the ${season} season`,
                roast: 'The collective output of one season of questionable decisions',
                variant: 'primary',
            },
            {
                title: 'Games Played',
                icon: 'trophy',
                value: s.bigNumbers.totalGames,
                desc: 'Total matchups this season',
                roast: 'Another season in the books',
                variant: 'default',
            },
            {
                title: 'Season Avg PPG',
                icon: 'trending-up',
                value: s.bigNumbers.avgPts,
                desc: `The ${season} scoring baseline`,
                roast: 'Where did this season stack up?',
                variant: 'secondary',
            },
        ]),
        renderSection('flame', 'Scoring Records', `The highs and lows of the ${season} season`, [
            {
                title: 'Most Points in a Game',
                icon: 'trending-up',
                value: sr.mostPtsValue,
                desc: `${sr.mostPtsTeamName} — Week ${sr.mostPtsWeek}`,
                roast: 'They woke up and chose violence',
                variant: 'primary',
            },
            {
                title: 'Fewest Points in a Game',
                icon: 'trending-down',
                value: sr.fewestPtsValue ?? '0',
                desc: `${sr.fewestPtsTeamName} — Week ${sr.fewestPtsWeek}`,
                roast: 'Did they even set a lineup?',
                variant: 'destructive',
            },
            {
                title: 'Fewest Points in a Win',
                icon: 'crown',
                value: sr.fewestPtsInWinValue ?? '0',
                desc: `${sr.fewestPtsInWinTeamName} — Week ${sr.fewestPtsInWinWeek}`,
                roast: 'Lucky to be alive',
                variant: 'secondary',
            },
            {
                title: 'Highest Combined Matchup',
                icon: 'zap',
                value: sr.highestCombinedValue,
                desc: `${sr.highestCombinedT1Name} vs ${sr.highestCombinedT2Name} — Week ${sr.highestCombinedWeek}`,
                roast: 'Both teams chose violence',
                variant: 'primary',
            },
            {
                title: 'Lowest Combined Matchup',
                icon: 'target',
                value: sr.lowestCombinedValue,
                desc: `${sr.lowestCombinedT1Name} vs ${sr.lowestCombinedT2Name} — Week ${sr.lowestCombinedWeek}`,
                roast: 'Nobody showed up that week',
                variant: 'default',
            },
        ]),
        renderSection('zap', 'Point Margins', `Blowouts and nail-biters of the ${season} season`, [
            {
                title: 'Largest Margin of Victory',
                icon: 'zap',
                value: pm.largestMarginValue,
                desc: `${pm.largestMarginT1Name} vs ${pm.largestMarginT2Name} — Week ${pm.largestMarginWeek}`,
                roast: "That's a blowout!",
                variant: 'primary',
            },
            {
                title: 'Smallest Margin of Victory',
                icon: 'target',
                value: pm.smallestMarginValue,
                desc: `${pm.smallestMarginT1Name} vs ${pm.smallestMarginT2Name} — Week ${pm.smallestMarginWeek}`,
                roast: 'Heart attack material',
                variant: 'secondary',
            },
            {
                title: 'Games Decided by < 1 pt',
                icon: 'flame',
                value: pm.gamesUnder1pt,
                desc: 'Decimal point drama this season',
                roast: 'Monday night nightmares',
                variant: 'destructive',
            },
            {
                title: 'Avg Margin of Victory',
                icon: 'trending-up',
                value: pm.avgMargin,
                desc: 'Average margin this season',
                roast: 'Comfort zone, quantified',
                variant: 'primary',
            },
            {
                title: 'Blowout Rate (20+ pts)',
                icon: 'zap',
                value: `${pm.blowoutRate}%`,
                desc: 'Season annihilation rate',
                roast: 'Mercy rule should exist',
                variant: 'default',
            },
        ]),
        renderSection('flame', 'The Streaks', `The longest runs of the ${season} season`, [
            {
                title: 'Longest Winning Streak',
                icon: 'trending-up',
                value: `${st.winStreakLength}W`,
                desc: st.winStreakTeamName,
                roast: 'Riding high!',
                variant: 'secondary',
            },
            {
                title: 'Longest Losing Streak',
                icon: 'trending-down',
                value: `${st.lossStreakLength}L`,
                desc: st.lossStreakTeamName,
                roast: 'Character-building moments',
                variant: 'destructive',
            },
        ]),
        renderSection('star', 'Season Leaderboard', `Who ran the ${season} season`, [
            {
                title: 'Season Points Leader',
                icon: 'crown',
                value: lb.ptsLeaderValue,
                desc: lb.ptsLeaderName,
                roast: 'Volume over everything this season',
                variant: 'primary',
            },
            {
                title: 'Winningest Manager',
                icon: 'trophy',
                value: lb.mostWinsValue,
                desc: lb.mostWinsName,
                roast: 'They owned this season',
                variant: 'secondary',
            },
            {
                title: 'Most Losses',
                icon: 'skull',
                value: lb.mostLossesValue,
                desc: lb.mostLossesName,
                roast: 'Better luck next year',
                variant: 'destructive',
            },
            {
                title: 'Most Weekly Top Scores',
                icon: 'crown',
                value: tgh.mostTopScoresValue,
                desc: tgh.mostTopScoresName,
                roast: 'King of the week',
                variant: 'primary',
            },
        ]),
        renderSection('skull', "That's Gotta Hurt", `The ${season} season was not kind to everyone`, [
            {
                title: 'Most Points in a Loss',
                icon: 'skull',
                value: tgh.mostPtsInLossValue ?? '0',
                desc: `${tgh.mostPtsInLossTeamName} — Week ${tgh.mostPtsInLossWeek}`,
                roast: 'Wrong place, wrong time',
                variant: 'destructive',
            },
            {
                title: 'Most Points Faced',
                icon: 'target',
                value: tgh.mostPointsFacedValue,
                desc: tgh.mostPointsFacedName,
                roast: 'The universe had a vendetta this season',
                variant: 'destructive',
            },
            {
                title: 'Most Weekly Last Places',
                icon: 'skull',
                value: tgh.mostLastPlacesValue,
                desc: tgh.mostLastPlacesName,
                roast: 'Somebody had to hold the floor down',
                variant: 'destructive',
            },
        ]),
    ].join('');
}
