export type FadeSide = "left" | "right";

export type FadeOptions = {
    /** Side the element slides in from. Leave it out for no fade-in. */
    in?: FadeSide;
    /** Fade up and out when the element passes the top of the screen. */
    out?: boolean;
    /** 0 to 3. A higher number starts the fade-in a little later. */
    stagger?: number;
    /** Part of the screen height where the fade-out starts. */
    outStart?: number;
};

/**
 * Data attributes that ScrollFades.astro reads. Spread them on an element.
 * Without options, the element does not fade.
 */
export function fade(options?: FadeOptions) {
    if (!options) return {};
    const { in: side, out = true, stagger = 0, outStart } = options;
    return {
        "data-fade-in": side,
        "data-fade-out": out ? "" : undefined,
        "data-stagger": stagger,
        "data-out-start": outStart,
    };
}
