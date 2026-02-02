const htmlElement = document.documentElement;
const hamburgerButton = htmlElement.querySelector<HTMLButtonElement>(".hamburger")!;
const navOverlayElement = htmlElement.querySelector<HTMLElement>(".nav-overlay")!;

const MD_BREAKPOINT = 768;

window.addEventListener("resize", closeOverlayNavWithResize);
document.addEventListener("keydown", closeOverlayNavWithEscape);
hamburgerButton.addEventListener("click", navOverlayFunctionality);

function navOverlayFunctionality(): void {
    isNavOverlayHidden() ? openOverlayNav() : closeOverlayNav();
}

function isNavOverlayHidden(): boolean {
    return navOverlayElement.classList.contains("hidden");
}

function closeOverlayNav(): void {
    htmlElement.classList.remove("overlay-nav-open");
    hamburgerButton.classList.remove("open");
    navOverlayElement.classList.add("hidden");
}

function closeOverlayNavWithEscape(event: KeyboardEvent): void {
    if (!isNavOverlayHidden() && event.key === "Escape") closeOverlayNav();
}

function closeOverlayNavWithResize(): void {
    if (!isNavOverlayHidden() && window.innerWidth > MD_BREAKPOINT) closeOverlayNav();
}

function openOverlayNav(): void {
    htmlElement.classList.add("overlay-nav-open");
    hamburgerButton.classList.add("open");
    navOverlayElement.classList.remove("hidden");
}
