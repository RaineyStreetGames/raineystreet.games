// ── SVG cloud renderer ─────────────────────────────────────────────
// Generates procedural cloud shapes using overlapping circles.
// Fixed seed → same shapes every load. Direction is randomized.
// Note: blur filter adds softness but costs extra GPU compositing on mobile.

// ── Seeded PRNG (mulberry32) ───────────────────────────────────────

function mulberry32(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(7391);

// ── SVG cloud builder ──────────────────────────────────────────────

function makeSVGCloud(rng) {
  const ns         = 'http://www.w3.org/2000/svg';
  const numCircles = 4 + Math.floor(rng() * 4);
  const baseR      = 28 + rng() * 48;

  const circles = [];
  let curX = 0;
  for (let i = 0; i < numCircles; i++) {
    const r  = baseR * (0.5 + rng() * 0.85);
    curX    += r * (0.8 + rng() * 0.4);
    const y  = -(r * (0.25 + rng() * 0.35));
    circles.push({ cx: curX, cy: y, r });
    curX += r * 0.25;
  }

  const last   = circles[circles.length - 1];
  const totalW = last.cx + last.r;
  const minY   = Math.min(...circles.map(c => c.cy - c.r));
  const maxY   = Math.max(...circles.map(c => c.cy + c.r * 0.4));
  const pad    = 24;

  const svgW = totalW + pad * 2;
  const svgH = (maxY - minY) + pad * 2;

  const filterId = `cf${Math.floor(rng() * 999999)}`;

  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `${-pad} ${minY - pad} ${svgW} ${svgH}`);
  svg.setAttribute('width',  svgW);
  svg.setAttribute('height', svgH);
  svg.style.display   = 'block';
  svg.style.overflow  = 'visible';
  svg.setAttribute('aria-hidden', 'true');

  svg.innerHTML = `
    <defs>
      <filter id="${filterId}" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="5"/>
      </filter>
    </defs>
    <g filter="url(#${filterId})" fill="white" opacity="0.82">
      ${circles.map(c =>
        `<circle cx="${c.cx.toFixed(1)}" cy="${c.cy.toFixed(1)}" r="${c.r.toFixed(1)}"/>`
      ).join('')}
    </g>`;

  return { svg, width: svgW, height: svgH };
}

// ── Cloud definitions ──────────────────────────────────────────────
// baseYvh: vertical position as fraction of viewport height (can exceed 1.0)
// scale:   display size multiplier
// rate:    parallax + drift speed (higher = closer/faster)

const isMobile = window.innerWidth < 768;

const ALL_CLOUD_DEFS = [
  // Near layer
  { baseYvh: 1.10, scale: 2.2, rate: 0.58 },
  { baseYvh: 1.35, scale: 1.9, rate: 0.62 },
  { baseYvh: 1.62, scale: 2.4, rate: 0.66 },

  // Mid layer
  { baseYvh: 0.72, scale: 1.4, rate: 0.42 },
  { baseYvh: 0.88, scale: 1.6, rate: 0.45 },
  { baseYvh: 1.12, scale: 1.3, rate: 0.40 },
  { baseYvh: 1.32, scale: 1.7, rate: 0.48 },

  // Far layer
  { baseYvh: 0.38, scale: 0.9, rate: 0.27 },
  { baseYvh: 0.55, scale: 1.0, rate: 0.30 },
  { baseYvh: 0.70, scale: 0.8, rate: 0.25 },
  { baseYvh: 0.92, scale: 1.1, rate: 0.32 },

  // Lower-screen clouds
  { baseYvh: 0.74, scale: 1.6, rate: 0.38 },
  { baseYvh: 0.84, scale: 1.4, rate: 0.35 },
  { baseYvh: 0.94, scale: 1.9, rate: 0.43 },

  // Content-zone clouds
  { baseYvh: 1.80, scale: 0.8, rate: 0.65 },
  { baseYvh: 2.10, scale: 0.6, rate: 0.68 },
  { baseYvh: 2.40, scale: 0.7, rate: 0.72 },
];

const CLOUD_DEFS = isMobile
  ? ALL_CLOUD_DEFS.filter((_, i) => i % 3 === 0)
  : ALL_CLOUD_DEFS;

const cloudDirection = Math.random() < 0.5 ? 1 : -1;

function driftSpeed(rate) { return rate * 0.35; }

// ── Build and mount cloud elements ─────────────────────────────────

const cloudLayer    = document.getElementById('cloud-layer');
const cloudWrappers = [];

if (cloudLayer) {
  const total = CLOUD_DEFS.length;
  CLOUD_DEFS.forEach((def, i) => {
    const { svg, width: svgW } = makeSVGCloud(rng);

    svg.style.transform       = `scale(${def.scale})`;
    svg.style.transformOrigin = 'left top';

    const inner = document.createElement('div');
    inner.appendChild(svg);

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      will-change: transform;
      pointer-events: none;
    `;
    wrapper.appendChild(inner);
    cloudLayer.appendChild(wrapper);

    const zoneW  = window.innerWidth / total;
    const startX = i * zoneW + Math.random() * zoneW;

    cloudWrappers.push({
      wrapper,
      def,
      x:          startX,
      speed:      driftSpeed(def.rate),
      cloudWidth: svgW * def.scale,
    });
  });
}

// ── Draw function (called each frame by main.js) ───────────────────

function drawClouds(scrollY) {
  if (cloudWrappers.length === 0) return;

  const vh = window.innerHeight;
  const vw = window.innerWidth;

  cloudWrappers.forEach((cw) => {
    cw.x += cw.speed * cloudDirection;

    if (cloudDirection > 0 && cw.x > vw) {
      cw.x = -cw.cloudWidth;
    } else if (cloudDirection < 0 && cw.x + cw.cloudWidth < 0) {
      cw.x = vw;
    }

    const y = cw.def.baseYvh * vh - scrollY * cw.def.rate;
    cw.wrapper.style.transform = `translate(${cw.x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  });
}
