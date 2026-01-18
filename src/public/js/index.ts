console.log("Just in case we need some js on the front end, here we go");

const weeksSelect = document.querySelector<HTMLSelectElement>('[name="weeks-select"]');
const leaguesSelect = document.querySelector<HTMLSelectElement>('[name="leagues-select"]');

weeksSelect?.addEventListener("change", function () {
    const weekValue: string = this.value;
    const leagueId = window.location.pathname.split('/')[2];
    location.href = `/leagues/${leagueId}/weeks/${weekValue}`;
});


leaguesSelect?.addEventListener("change", function () {
    const leagueId: string = this.value;
    const weekValue = weeksSelect?.value;
    location.href = `/leagues/${leagueId}/weeks/${weekValue}`;
});