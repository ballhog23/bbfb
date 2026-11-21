// An empty span, not an <svg>. Browsers can wrap before or after an inline
// SVG, so the icon or the period after the link could start a new line.
const ICON = `<span class="external-icon" aria-hidden="true"></span>`;

/** Text for an off-site link, with the icon and a note for screen readers. */
export function externalText(text: string): string {
    return `${text.trim()}${ICON}<span class="sr-only"> (opens in a new tab)</span>`;
}
