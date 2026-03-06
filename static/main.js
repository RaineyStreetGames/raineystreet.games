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
  const maxScroll = document.body.scrollHeight - cachedVH;
  const progress  = maxScroll > 0 ? Math.min(currentScrollY / maxScroll, 1) : 0;

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


// ── Cached viewport dimensions ─────────────────────────────────────

let cachedVW = window.innerWidth;
let cachedVH = window.innerHeight;

window.addEventListener('resize', () => {
  cachedVW = window.innerWidth;
  cachedVH = window.innerHeight;
}, { passive: true });


// ── Logo scroll fade ───────────────────────────────────────────────

const heroScroll  = document.querySelector('.hero-scroll');
const logoWrap    = document.getElementById('hero-logo-wrap');
const heroHeight  = heroScroll ? heroScroll.offsetHeight : 0;
const logoFadeRange = heroHeight * 0.38;

function updateLogo() {
  if (!heroScroll || !logoWrap) return;
  const fadeRange = logoFadeRange;
  const opacity   = Math.max(0, 1 - currentScrollY / fadeRange);
  logoWrap.style.opacity = opacity;
  if (currentScrollY > 0) {
    logoWrap.style.transform = `translateY(${-(currentScrollY * 0.35).toFixed(1)}px)`;
  }
}


// ── Scroll state (read by the rAF loop) ───────────────────────────
// Only store the scroll position in the handler — all DOM writes
// happen inside the rAF loop to avoid layout thrashing.

let currentScrollY = window.scrollY;
let scrollDirty    = false;

window.addEventListener('scroll', () => {
  currentScrollY = window.scrollY;
  scrollDirty    = true;
}, { passive: true });


// ── Animation loop ────────────────────────────────────────────────
// Handles cloud drift, scroll parallax, background color, and logo
// fade — all in one rAF loop to batch DOM writes per frame.

function animate() {
  // Process scroll-driven updates once per frame
  if (scrollDirty) {
    updateBackground();
    updateLogo();
    scrollDirty = false;
  }

  if (typeof drawClouds === 'function') drawClouds(currentScrollY);

  requestAnimationFrame(animate);
}

// Initial updates
updateBackground();
updateLogo();
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
