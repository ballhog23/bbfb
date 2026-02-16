const SVG_NS = 'http://www.w3.org/2000/svg';

function svg(attrs: Record<string, string>, ...children: Element[]): SVGSVGElement {
    const el = document.createElementNS(SVG_NS, 'svg');
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    for (const child of children) el.appendChild(child);
    return el;
}

function path(d: string): SVGPathElement {
    const el = document.createElementNS(SVG_NS, 'path');
    el.setAttribute('d', d);
    return el;
}

function circle(cx: string, cy: string, r: string): SVGCircleElement {
    const el = document.createElementNS(SVG_NS, 'circle');
    el.setAttribute('cx', cx);
    el.setAttribute('cy', cy);
    el.setAttribute('r', r);
    return el;
}

const BASE_ATTRS: Record<string, string> = {
    xmlns: SVG_NS,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
};

export function iconCrown(): SVGSVGElement {
    return svg(BASE_ATTRS,
        path('M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z'),
        path('M5 21h14'),
    );
}

export function iconSkull(): SVGSVGElement {
    return svg({
        xmlns: SVG_NS,
        viewBox: '0 -960 960 960',
        fill: 'currentColor',
        'aria-hidden': 'true',
    },
        path('M240-80v-170q-39-17-68.5-45.5t-50-64.5q-20.5-36-31-77T80-520q0-158 112-259t288-101q176 0 288 101t112 259q0 42-10.5 83t-31 77q-20.5 36-50 64.5T720-250v170H240Zm80-80h40v-80h80v80h80v-80h80v80h40v-142q38-9 67.5-30t50-50q20.5-29 31.5-64t11-74q0-125-88.5-202.5T480-800q-143 0-231.5 77.5T160-520q0 39 11 74t31.5 64q20.5 29 50.5 50t67 30v142Zm100-200h120l-60-120-60 120Zm-80-80q33 0 56.5-23.5T420-520q0-33-23.5-56.5T340-600q-33 0-56.5 23.5T260-520q0 33 23.5 56.5T340-440Zm280 0q33 0 56.5-23.5T700-520q0-33-23.5-56.5T620-600q-33 0-56.5 23.5T540-520q0 33 23.5 56.5T620-440ZM480-160Z'),
    );
}

export function iconFlame(): SVGSVGElement {
    return svg(BASE_ATTRS,
        path('M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z'),
    );
}

export function iconTarget(): SVGSVGElement {
    return svg(BASE_ATTRS,
        circle('12', '12', '10'),
        circle('12', '12', '6'),
        circle('12', '12', '2'),
    );
}
