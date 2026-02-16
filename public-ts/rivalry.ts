import { fetchJSON } from "./shared/lib.js";
import "./shared/nav.ts";

const challengerSelect = document.querySelector<HTMLSelectElement>('#challenger')!;
const opponentSelect = document.querySelector<HTMLSelectElement>('#opponent')!;
const battleBtn = document.querySelector<HTMLButtonElement>('#battle-btn')!;
const selects = [challengerSelect, opponentSelect];

selects.forEach(el => el.addEventListener('change', handleSelectChange));
battleBtn.addEventListener('click', handleBattle);

function handleSelectChange(event: Event) {
    const changed = event.target as HTMLSelectElement;
    const other = selects.find(el => el !== changed)!;
    Array.from(other.options).forEach(opt => {
        if (opt.value !== 'select-team') opt.disabled = false;
    });
    other.querySelector<HTMLOptionElement>(`option[value="${changed.value}"]`)!.disabled = true;

    const container = changed.closest('.team-select')!;
    const placeholder = container.querySelector<HTMLImageElement>('.placeholder-avatar')!;
    const avatars = container.querySelectorAll<HTMLImageElement>('.team-avatar-option');

    placeholder.classList.add('hidden');
    avatars.forEach(img => img.classList.remove('active'));

    const selected = container.querySelector<HTMLImageElement>(`.team-avatar-option[data-user-id="${changed.value}"]`);
    if (selected) selected.classList.add('active');

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
        const data = await fetchJSON(`/api/web/rivalry-page/${challenger}/${opponent}`);
        console.log(data);
    } catch (err) {
        console.error('Battle fetch failed:', err);
    } finally {
        battleBtn.disabled = false;
    }
}
