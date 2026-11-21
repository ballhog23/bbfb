async function T(e){let t=await fetch(e,{signal:AbortSignal.timeout(1e4)});if(!t.ok)throw new Error(`HTTP ${t.status} at ${e}`);let n=t.headers.get("content-type")||"";if(!n.includes("application/json"))throw new Error(`Expected JSON, received ${n}`);return await t.json()}function a(e){let t=document.createElement("div");return t.textContent=String(e),t.innerHTML}function d(e,t){let n=e.target;return n?n.closest(t):null}var p=document.documentElement,y=p.querySelector(".hamburger"),h=p.querySelector(".nav-overlay"),w=p.querySelector(".league-menu-toggle"),g=p.querySelector("#league-info-menu"),k=768,b=[];function R(e){b.push(e),e.trigger.addEventListener("click",()=>{e.isOpen()?e.close():e.open()})}document.addEventListener("keydown",e=>{e.key==="Escape"&&b.forEach(t=>t.isOpen()?t.close():null)});window.addEventListener("resize",()=>{b.forEach(e=>{e.shouldCloseOnResize()&&e.isOpen()&&e.close()})});R({trigger:y,target:h,isOpen:()=>!h.classList.contains("hidden"),shouldCloseOnResize:()=>window.innerWidth>k,open(){p.classList.add("overlay-nav-open"),y.classList.add("open"),h.classList.remove("hidden")},close(){p.classList.remove("overlay-nav-open"),y.classList.remove("open"),h.classList.add("hidden")}});R({trigger:w,target:g,isOpen:()=>!g.classList.contains("hidden"),shouldCloseOnResize:()=>window.innerWidth<k,open(){g.classList.remove("hidden"),g.classList.add("open"),w.setAttribute("aria-expanded","true")},close(){g.classList.add("hidden"),g.classList.remove("open"),w.setAttribute("aria-expanded","false")}});var L=document.getElementById("matchups-content"),P=document.querySelector(".standings-container"),m=document.querySelector("#league-select"),M=document.querySelector("#week-select"),E=document.querySelector("#season-header"),v=document.querySelector(".matchups-header"),f=e=>e?.toLowerCase().includes("twistedtitteas")??!1;window.addEventListener("DOMContentLoaded",()=>{let e=parseInt(L.dataset.currentWeek||"1"),t={matchupsTitle:E.innerHTML,leagueId:m.value,weekValue:e,contentHTML:L.innerHTML,standingsHTML:P.innerHTML,isPlayoffs:e>=15,showSeasonNav:!!document.querySelector(".season-navigation")};history.replaceState(t,"",location.href)});window.addEventListener("popstate",e=>{let t=e.state;t&&H(t)});window.addEventListener("click",e=>{let t=d(e,".matchup-card-link"),n=d(e,".standings-row-link"),r=d(e,"dialog"),o=d(e,".tab-button");if(o){let l=o.dataset.bracket;if(l){document.querySelectorAll(".tab-button").forEach(u=>u.classList.remove("active")),o.classList.add("active"),document.querySelectorAll(".bracket-container").forEach(u=>{u.classList.remove("active")});let i=document.querySelector(`[data-bracket-type="${l}"]`);i&&i.classList.add("active")}return}if(t){e.preventDefault(),t.closest(".matchup-card")?.querySelector("dialog")?.showModal();return}if(r){d(e,".matchups-dialog-wrapper, .players-wrapper")||r.close();return}if(n){e.preventDefault(),n.closest("tr")?.querySelector("dialog")?.showModal();return}let s=d(e,"tbody tr");if(s){s.querySelector("dialog")?.showModal();return}});v.addEventListener("click",async e=>{let t=d(e,".season-navigation .nav-link");if(!t)return;let n=t.dataset.view,o=history.state?.weekValue||1,s;n==="regular"?s=o>=15?14:o:s=17,v.querySelectorAll(".season-navigation .nav-link").forEach(l=>l.classList.remove("active")),t.classList.add("active");try{await I(m.value,s)}catch(l){l instanceof Error?console.error(l.message):console.error(l)}});m?.addEventListener("change",S);M?.addEventListener("change",S);async function I(e,t){let n=`/api/web/matchups-page/leagues/${e}/weeks/${t}`,r=await T(n),o=r.currentWeek>=15,s=`/matchups/leagues/${e}/weeks/${r.currentWeek}`,l=o?W(r):O(r);history.pushState(l,"",s),H(l)}async function S(e){let t=e.target,n=m.value,o=t===m?17:parseInt(t.value);try{await I(n,o)}catch(s){s instanceof Error?console.error(s.message):console.error(s)}}function O(e){let{matchups:t,rosters:n,currentLeagueSeason:r,currentWeek:o,currentLeagueId:s,isCurrentLeague:l,isPostSeason:i}=e;return{matchupsTitle:`Season ${r} - Week ${o}`,leagueId:s,weekValue:o,contentHTML:A(t,o),standingsHTML:N(n,r),isPlayoffs:!1,showSeasonNav:!l||i}}function W(e){let{matchups:t,rosters:n,currentLeagueSeason:r,currentWeek:o,currentLeagueId:s}=e;return{matchupsTitle:`Season ${r} - Playoffs`,leagueId:s,weekValue:o,contentHTML:F(t),standingsHTML:N(n,r),isPlayoffs:!0,showSeasonNav:!0}}function H(e){document.title=`Matchups | ${e.matchupsTitle}`,E.innerHTML=e.matchupsTitle,L.innerHTML=e.contentHTML,P.innerHTML=e.standingsHTML,m.value=e.leagueId,M&&(M.value=e.weekValue.toString());let t=v.querySelector(".season-navigation");e.showSeasonNav?t?t.querySelectorAll(".nav-link").forEach(r=>{let o=r.dataset.view;o==="playoffs"&&e.isPlayoffs||o==="regular"&&!e.isPlayoffs?r.classList.add("active"):r.classList.remove("active")}):v.insertAdjacentHTML("beforeend",q(e.isPlayoffs)):t?.remove();let n=document.querySelector("#week-select");n&&n.addEventListener("change",S)}function q(e){return`
        <nav class="season-navigation">
            <button class="btn nav-link ${e?"":"active"}" data-view="regular">Regular Season</button>
            <button class="btn nav-link ${e?"active":""}" data-view="playoffs">Playoffs</button>
        </nav>
    `}function A(e,t){return`
        ${x(t)}
        <section class="matchups-wrapper">
            ${e.map(V).join("")}
        </section>
    `}function F(e){return`
        <div class="bracket-tabs">
            <button class="btn tab-button active" data-bracket="winnersBracket">Winners</button>
            <button class="btn tab-button" data-bracket="losersBracket">Losers</button>
        </div>
        <section class="playoff-bracket">
            <div class="bracket-container active" data-bracket-type="winnersBracket">
                ${$(e.winnersBracket)}
            </div>
            <div class="bracket-container" data-bracket-type="losersBracket">
                ${$(e.losersBracket)}
            </div>
        </section>
    `}function x(e){return`
        <div class="week-select-wrapper">
            <label class="week-select-label" for="week-select">Select Week</label>
            <div class="select-wrapper">
                <select id="week-select" name="select-week">
                    ${Array.from({length:14},(t,n)=>n+1).map(t=>`
                        <option value="${t}" ${t===e?"selected":""}>
                            Week ${t}
                        </option>
                    `).join("")}
                </select>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6"></path>
                </svg>
            </div>
        </div>
    `}function $(e){return!e||e.length===0?'<p class="no-data">No bracket data available</p>':`
        <div class="bracket-rounds">
            ${e.map(t=>`
                <div class="round-container">
                    <div class="round-header">
                        <h3>Round ${t.round}</h3>
                    </div>
                    <div class="round-matchups">
                        ${t.matchups.map(j).join("")}
                    </div>
                </div>
            `).join("")}
        </div>
    `}function j(e){return`
        <div class="matchup-card" data-matchup-id="${e.bracketMatchupId}" data-week="${e.week}">
            <a class="matchup-card-link" href="#" role="button">
                ${B(e)}
            </a>
            ${z(e)}
        </div>
    `}function B(e){let t=(l,i)=>l||i||"TBD",n=(l,i,u)=>f(u)?i:l??i,r=parseFloat(e.t1Points)||0,o=parseFloat(e.t2Points)||0,s=(l,i,u)=>e.winnerId!=null?e.winnerId===l?"winner":"loser":i>u?"winner":i<u?"loser":"";return`
        <section class="home-team ${s(e.t1RosterId,r,o)}">
            <img
                src="${n(e.t1TeamImage,e.t1OwnerImage,e.t1Owner)||"https://placehold.co/50"}"
                alt="${a(t(e.t1Team,e.t1Owner))} team logo"
                loading="lazy"
                decoding="async"
            />
            <div class="team-details">
                <h3>${a(t(e.t1Team,e.t1Owner))}</h3>
                <p>${a(e.t1Points)}</p>
            </div>
        </section>
        <span class="vs">vs</span>
        <section class="away-team ${s(e.t2RosterId,o,r)}">
            <img
                src="${n(e.t2TeamImage,e.t2OwnerImage,e.t2Owner)||"https://placehold.co/50"}"
                alt="${a(t(e.t2Team,e.t2Owner))} team logo"
                loading="lazy"
                decoding="async"
            />
            <div class="team-details">
                <h3>${a(t(e.t2Team,e.t2Owner))}</h3>
                <p>${a(e.t2Points)}</p>
            </div>
        </section>
    `}function z(e){return`
        <dialog class="matchup-modal">
            <button class="btn">Close</button>
            <section class="matchups-dialog-wrapper">
                <div class="matchup-card">
                    ${B(e)}
                </div>
                <div class="rosters-wrapper">
                    <div class="roster home-team-players">
                        ${c(e.t1StartingRoster,"Starting")}
                        ${c(e.t1BenchRoster,"Bench")}
                    </div>
                    <div class="roster away-team-players">
                        ${c(e.t2StartingRoster,"Starting")}
                        ${c(e.t2BenchRoster,"Bench")}
                    </div>
                </div>
            </section>
        </dialog>
    `}function D(e){let t="points"in e;return`
    <div class="player-card">
        <img
            class="player-avatar"
            src="${e.playerImage||"https://placehold.co/50"}"
            alt="${a(e.playerName)} headshot"
            loading="lazy"
            decoding="async"
        />
        <div class="player-info">
            <div class="player-name">${a(e.playerName)}</div>
            <div class="player-meta">
                <span class="player-position pos-${a(e.position?.toLowerCase()||"")}">
                    ${a(e.position)}
                </span>
                ${e.team?`<span class="player-team">${a(e.team)}</span>`:""}
            </div>
        </div>
        ${t?`<div class="player-stats">
                       <span class="stat-value">${a(e.points)}</span>
                   </div>`:""}
    </div>
    `}function c(e,t){return!e||!e.length?"":`
    <div class="player-list-section">
        ${t?`<h4 class="roster-section-label">${a(t)}</h4>`:""}
        <div class="player-list">
            ${e.map(D).join("")}
        </div>
    </div>
    `}function C([e,t]){let n=s=>s.team??s.owner,r=s=>f(s.owner)?s.ownerImage:s.teamImage??s.ownerImage,o=(s,l)=>{let i=parseFloat(s.points)||0,u=parseFloat(l.points)||0;return i>u?"winner":i<u?"loser":""};return`
    <section class="home-team ${o(e,t)}">
        <img
            src="${r(e)||"https://placehold.co/50"}"
            alt="${a(n(e))} team logo"
            loading="lazy"
            decoding="async"
        />
        <div class="team-details">
            <h3>${a(n(e))}</h3>
            <p>${a(e.points)}</p>
        </div>
    </section>
    <span class="vs">vs</span>
    <section class="away-team ${o(t,e)}">
        <img
            src="${r(t)||"https://placehold.co/50"}"
            alt="${a(n(t))} team logo"
            loading="lazy"
            decoding="async"
        />
        <div class="team-details">
            <h3>${a(n(t))}</h3>
            <p>${a(t.points)}</p>
        </div>
    </section>
    `}function U([e,t]){return`
    <dialog class="matchup-modal">
        <button class="btn">Close</button>
        <section class="matchups-dialog-wrapper">
            <div class="matchup-card">
                ${C([e,t])}
            </div>
            <div class="rosters-wrapper">
                <div class="roster home-team-players">
                    ${c(e.startingRoster,"Starting")}
                    ${c(e.benchRoster,"Bench")}
                    ${c(e.reserveRoster,"Injured Reserve")}
                </div>
                <div class="roster away-team-players">
                    ${c(t.startingRoster,"Starting")}
                    ${c(t.benchRoster,"Bench")}
                    ${c(t.reserveRoster,"Injured Reserve")}
                </div>
            </div>
        </section>
    </dialog>
    `}function V(e){return`
    <div class="matchup-card">
        <a class="matchup-card-link" href="#" role="button">
            ${C(e)}
        </a>
        ${U(e)}
    </div>
    `}function N(e,t){return`
        <header>
            <h2>${a(t)} Regular Season Standings</h2>
        </header>
        <div id="standings-wrapper">
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
                    ${e.map(_).join("")}
                </tbody>
            </table>
        </div>
    `}function _(e){let t=e.teamName??e.ownerName;return`
    <tr>
        <th scope="row">
            <a class="standings-row-link" href="#" role="button">
                <img
                    src="${(f(e.ownerName)?e.ownerImage:e.teamImage??e.ownerImage)||"https://placehold.co/50"}"
                    alt="${a(t)} team logo"
                    loading="lazy"
                    decoding="async"
                />
                <span>${a(t)}</span>
            </a>
        </th>
        <td>${a(e.pointsFor.toString())}</td>
        <td>${a(e.pointsAgainst.toString())}</td>
        <td>${a(e.wins.toString())} / ${a(e.losses.toString())}</td>
        <td class="roster-modal-cell">
            <dialog class="rosters-modal">
                <button class="btn">Close</button>
                <section class="players-wrapper">
                    <header>
                        <img
                            src="${(f(e.ownerName)?e.ownerImage:e.teamImage??e.ownerImage)||"https://placehold.co/50"}"
                            alt="${a(t)} team logo"
                            loading="lazy"
                            decoding="async"
                        />
                        <h3>${a(t)}</h3>
                    </header>
                    <div class="roster">
                        ${c(e.startingRoster,"Starting")}
                        ${c(e.benchRoster,"Bench")}
                        ${c(e.reserveRoster,"Injured Reserve")}
                    </div>
                </section>
            </dialog>
        </td>
    </tr>
    `}
