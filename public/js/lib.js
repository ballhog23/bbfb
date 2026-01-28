export async function fetchJSON(url) {
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
export function escapeForHTML(value) {
    const div = document.createElement("div");
    div.textContent = String(value);
    return div.innerHTML;
}
export function toggleClassToBodyElement(className, enabled) {
    return document.body.classList.toggle(className, enabled);
}
export function findNearestElement(event, selector) {
    const target = event.target;
    if (!target)
        return null;
    return target.closest(selector);
}
