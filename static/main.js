// ── Scroll background ──────────────────────────────────────────────
// Home page: sky blue → deep blue as you scroll.
// Inner pages: fixed color per page.

const SKY  = [91,  184, 245]; // #5bb8f5  — home hero top
const DEEP = [55,  128, 198]; // #3780c6  — home hero bottom / games fallback

// Per-page background colors. Path matching strips trailing slash + index.html.
const PAGE_COLORS = {
  '/about':                  [63,  168, 130], // Sage    #3fa882
  '/games/kithwind':         [72,  112, 184], // Slate Blue #4870b8
  '/games/kithwind/wilds':   [192, 136,  64], // Amber   #c08840
  '/games/kithwind/legends': [176,  96,  64], // Ember   #b06040
};

const isHomePage = !!document.querySelector('.hero-scroll');

function updateBackground() {
  if (!isHomePage) return;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const progress  = maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0;

  const r = Math.round(SKY[0] + (DEEP[0] - SKY[0]) * progress);
  const g = Math.round(SKY[1] + (DEEP[1] - SKY[1]) * progress);
  const b = Math.round(SKY[2] + (DEEP[2] - SKY[2]) * progress);

  document.documentElement.style.setProperty('--bg', `${r}, ${g}, ${b}`);
}

if (!isHomePage) {
  const path  = window.location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '').replace(/^\/raineystreet\.games/, '') || '/';
  const color = PAGE_COLORS[path] || DEEP;
  document.documentElement.style.setProperty('--bg', `${color[0]}, ${color[1]}, ${color[2]}`);
}


// ── Seeded PRNG (mulberry32) ───────────────────────────────────────
// Fixed seed = same cloud shapes every load. Direction is random.

function mulberry32(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(7391);


// ── Cloud SVG generation ───────────────────────────────────────────

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
// rate also drives horizontal drift speed: closer (higher rate) = faster.

const CLOUD_DEFS = [
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

  // Lower-screen clouds — visible in the bottom half at page load
  { baseYvh: 0.74, scale: 1.6, rate: 0.38 },
  { baseYvh: 0.84, scale: 1.4, rate: 0.35 },
  { baseYvh: 0.94, scale: 1.9, rate: 0.43 },

  // Content-zone clouds — sparse, appear while scrolling through the panels
  { baseYvh: 1.80, scale: 0.8, rate: 0.65 },
  { baseYvh: 2.10, scale: 0.6, rate: 0.68 },
  { baseYvh: 2.40, scale: 0.7, rate: 0.72 },
];

// Coin flip on page load: all clouds drift the same direction.
// Speed varies per cloud based on parallax rate (closer = faster).
const cloudDirection = Math.random() < 0.5 ? 1 : -1;

// px per frame at 60fps. Near ~0.23, mid ~0.16, far ~0.10
function driftSpeed(rate) {
  return rate * 0.35;
}


// ── Build and mount cloud elements ────────────────────────────────

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

    // Stratified random start: each cloud owns one equal zone of the screen
    // so clouds are spread rather than clumped.
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


// ── Logo scroll fade ───────────────────────────────────────────────

const heroScroll = document.querySelector('.hero-scroll');
const logoWrap   = document.getElementById('hero-logo-wrap');

function updateLogo(scrollY) {
  if (!heroScroll || !logoWrap) return;
  const fadeRange = heroScroll.offsetHeight * 0.38;
  const opacity   = Math.max(0, 1 - scrollY / fadeRange);
  logoWrap.style.opacity = opacity;
  // Drift upward as user scrolls; guard keeps the CSS entrance animation intact
  if (scrollY > 0) {
    logoWrap.style.transform = `translateY(${-(scrollY * 0.35).toFixed(1)}px)`;
  }
}


// ── Scroll state (read by the rAF loop) ───────────────────────────

let currentScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  currentScrollY = window.scrollY;
  updateBackground();
  updateLogo(currentScrollY);
}, { passive: true });

updateBackground();
updateLogo(currentScrollY);


// ── Animation loop ────────────────────────────────────────────────
// Handles both horizontal cloud drift (with edge wrapping)
// and vertical scroll parallax in one rAF loop.

function animate() {
  if (cloudWrappers.length > 0) {
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    cloudWrappers.forEach((cw) => {
      // Drift horizontally
      cw.x += cw.speed * cloudDirection;

      // Wrap when fully off-screen
      if (cloudDirection > 0 && cw.x > vw) {
        cw.x = -cw.cloudWidth;
      } else if (cloudDirection < 0 && cw.x + cw.cloudWidth < 0) {
        cw.x = vw;
      }

      // Vertical position driven by scroll
      const y = cw.def.baseYvh * vh - currentScrollY * cw.def.rate;

      cw.wrapper.style.transform = `translate(${cw.x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    });
  }

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);


// ── Scroll-triggered content animations ───────────────────────────

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));


// ── Logo image fallback ────────────────────────────────────────────

const logoImg = document.querySelector('.hero-logo-img');
if (logoImg) {
  logoImg.addEventListener('error', () => {
    logoImg.style.display = 'none';
  });
}
