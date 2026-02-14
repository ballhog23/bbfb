const htmlElement = document.documentElement;
const hamburgerButton = htmlElement.querySelector<HTMLButtonElement>(".hamburger")!;
const navOverlayElement = htmlElement.querySelector<HTMLElement>(".nav-overlay")!;
const dropdownNavButton = htmlElement.querySelector<HTMLButtonElement>('.league-menu-toggle')!;
const dropdownNav = htmlElement.querySelector<HTMLUListElement>('#league-info-menu')!;
const MD_BREAKPOINT = 768;

interface NavToggle {
    trigger: HTMLButtonElement;
    target: HTMLElement;
    open(): void;
    close(): void;
    isOpen(): boolean;
    shouldCloseOnResize(): boolean;
}

const toggles: NavToggle[] = [];

function registerToggle(toggle: NavToggle): void {
    toggles.push(toggle);
    toggle.trigger.addEventListener("click", () => {
        toggle.isOpen() ? toggle.close() : toggle.open();
    });
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        toggles.forEach(
            t => t.isOpen() ? t.close() : null
        );
    }
});

window.addEventListener("resize", () => {
    toggles.forEach(t => {
        t.shouldCloseOnResize() && t.isOpen() ? t.close() : null;
    });
});

registerToggle({
    trigger: hamburgerButton,
    target: navOverlayElement,
    isOpen: () => !navOverlayElement.classList.contains("hidden"),
    shouldCloseOnResize: () => window.innerWidth > MD_BREAKPOINT,
    open() {
        htmlElement.classList.add("overlay-nav-open");
        hamburgerButton.classList.add("open");
        navOverlayElement.classList.remove("hidden");
    },
    close() {
        htmlElement.classList.remove("overlay-nav-open");
        hamburgerButton.classList.remove("open");
        navOverlayElement.classList.add("hidden");
    },
});

registerToggle({
    trigger: dropdownNavButton,
    target: dropdownNav,
    isOpen: () => !dropdownNav.classList.contains("hidden"),
    shouldCloseOnResize: () => window.innerWidth < MD_BREAKPOINT,
    open() {
        dropdownNav.classList.remove("hidden");
        dropdownNav.classList.add("open");
        dropdownNavButton.setAttribute("aria-expanded", "true");
    },
    close() {
        dropdownNav.classList.add("hidden");
        dropdownNav.classList.remove("open");
        dropdownNavButton.setAttribute("aria-expanded", "false");
    },
});
