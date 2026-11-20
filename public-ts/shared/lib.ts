// stop a request that hangs, so the page shows an error instead of waiting
export const FETCH_TIMEOUT_MS = 10_000;

export async function fetchJSON<T>(url: string): Promise<T> {
    const response = await fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} at ${url}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
        throw new Error(`Expected JSON, received ${contentType}`);
    }

    return await response.json();
}

export function escapeForHTML(value: string | number) {
    const div = document.createElement("div");
    div.textContent = String(value);
    return div.innerHTML;
}

export function toggleClassToBodyElement(className: string, enabled: boolean) {
    return document.body.classList.toggle(className, enabled);
}

export function findNearestElement<T extends HTMLElement = HTMLElement>(
    event: PointerEvent,
    selector: string
): T | null {
    const target = event.target as Element | null;
    if (!target) return null;
    return target.closest(selector) as T | null;
}

export function debounce(fn: () => void, ms: number): () => void {
    let timeout: ReturnType<typeof setTimeout>;

    return () => {
        clearTimeout(timeout);
        timeout = setTimeout(fn, ms);
    };
}
