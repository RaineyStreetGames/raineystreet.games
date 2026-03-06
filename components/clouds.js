// ── Cloud canvas renderer ───────────────────────────────────────────
// Loads individual cloud PNGs and draws them on a single canvas.
// Add your cloud images to the array below — one path per file.
//
// BASE_CLOUD_W: target pixel width every cloud is normalized to before
// the per-cloud scale multiplier is applied. Increase to make all
// clouds larger; decrease to shrink them. The def.scale values then
// work as relative size multipliers on top of this baseline.
const BASE_CLOUD_W = 320;

const CLOUD_IMAGES = [
  'assets/clouds/cloud1.png',
  'assets/clouds/cloud2.png',
  'assets/clouds/cloud3.png',
  'assets/clouds/cloud4.png',
  'assets/clouds/cloud5.png',
  'assets/clouds/cloud6.png',
];

// ── Image loading ──────────────────────────────────────────────────

const loadedImages = [];  // parallel array to CLOUD_IMAGES, null until loaded
let imagesReady    = 0;   // count of successfully loaded images

CLOUD_IMAGES.forEach((src, i) => {
  const img = new Image();
  img.onload = () => { loadedImages[i] = img; imagesReady++; };
  img.onerror = () => { loadedImages[i] = null; };
  img.src = src;
  loadedImages[i] = null; // placeholder
});

// ── Cloud definitions ──────────────────────────────────────────────
// baseYvh: vertical position as fraction of viewport height (can exceed 1.0)
// scale:   display size multiplier
// rate:    parallax + drift speed (higher = closer/faster)

const isMobile = window.innerWidth < 768;

// Clouds are grouped into far/mid/near layers, then sorted by scale
// at draw time so larger clouds always render in front.
// baseYvh starts at 0.6 (lower on screen) and extends to 3.2 for
// deep-scroll coverage. Counts are kept low for clean spacing.

const FAR_CLOUDS = [
  { baseYvh: 0.62, scale: 0.72, rate: 0.22 },
  { baseYvh: 0.95, scale: 0.80, rate: 0.24 },
  { baseYvh: 1.28, scale: 0.75, rate: 0.23 },
  { baseYvh: 1.60, scale: 0.68, rate: 0.21 },
];

const MID_CLOUDS = [
  { baseYvh: 0.75, scale: 1.25, rate: 0.36 },
  { baseYvh: 1.05, scale: 1.40, rate: 0.40 },
  { baseYvh: 1.38, scale: 1.30, rate: 0.37 },
  { baseYvh: 1.65, scale: 1.45, rate: 0.42 },
  { baseYvh: 1.80, scale: 1.20, rate: 0.35 },
];

const NEAR_CLOUDS = [
  { baseYvh: 0.88, scale: 1.90, rate: 0.55 },
  { baseYvh: 1.18, scale: 2.10, rate: 0.60 },
  { baseYvh: 1.50, scale: 1.85, rate: 0.57 },
  { baseYvh: 1.80, scale: 2.20, rate: 0.63 },
];

const ALL_CLOUD_DEFS = [...FAR_CLOUDS, ...MID_CLOUDS, ...NEAR_CLOUDS];

// Mobile: 2 per layer (6 total) — keeps all three depth layers represented.
const CLOUD_DEFS = isMobile
  ? [...FAR_CLOUDS.slice(0, 2), ...MID_CLOUDS.slice(0, 2), ...NEAR_CLOUDS.slice(0, 2)]
  : ALL_CLOUD_DEFS;

const cloudDirection = Math.random() < 0.5 ? 1 : -1;

function driftSpeed(rate) { return rate * 0.35; }

// ── Canvas setup ───────────────────────────────────────────────────

const cloudCanvas = document.getElementById('cloud-layer');
const ctx         = cloudCanvas ? cloudCanvas.getContext('2d') : null;

let cloudVW = window.innerWidth;
let cloudVH = window.innerHeight;

if (cloudCanvas) {
  cloudCanvas.width  = cloudVW;
  cloudCanvas.height = cloudVH;
}

window.addEventListener('resize', () => {
  cloudVW = window.innerWidth;
  cloudVH = window.innerHeight;
  if (cloudCanvas) {
    cloudCanvas.width  = cloudVW;
    cloudCanvas.height = cloudVH;
  }
}, { passive: true });

// ── Cloud state ────────────────────────────────────────────────────
// Each cloud picks a random image index — resolved at draw time so
// clouds that loaded before others still get assigned images.

const clouds = [];

if (cloudCanvas) {
  const total = CLOUD_DEFS.length;
  CLOUD_DEFS.forEach((def, i) => {
    const zoneW  = cloudVW / total;
    const startX = i * zoneW + Math.random() * zoneW;
    const imgIdx = Math.floor(Math.random() * CLOUD_IMAGES.length);

    clouds.push({
      def,
      x:      startX,
      speed:  driftSpeed(def.rate),
      imgIdx,
    });
  });

  // Draw smallest clouds first so larger ones render on top.
  clouds.sort((a, b) => a.def.scale - b.def.scale);
}

// ── Draw function (called each frame by main.js) ───────────────────

function drawClouds(scrollY) {
  if (!ctx || imagesReady === 0 || clouds.length === 0) return;

  const vw = cloudVW;
  const vh = cloudVH;

  ctx.clearRect(0, 0, vw, vh);
  ctx.globalAlpha = 0.88;

  clouds.forEach((cw) => {
    const img = loadedImages[cw.imgIdx];
    if (!img) return;

    cw.x += cw.speed * cloudDirection;

    const normalizedScale = (BASE_CLOUD_W / img.naturalWidth) * cw.def.scale;
    const dw = img.naturalWidth  * normalizedScale;
    const dh = img.naturalHeight * normalizedScale;

    if (cloudDirection > 0 && cw.x > vw) {
      cw.x = -dw;
    } else if (cloudDirection < 0 && cw.x + dw < 0) {
      cw.x = vw;
    }

    const y = cw.def.baseYvh * vh - scrollY * cw.def.rate;
    if (y + dh < 0 || y > vh) return;

    // Atmospheric blur: far (small) clouds are softer, near ones are sharp.
    // ctx.filter blur is applied at draw time — no extra GPU layers.
    // far ~3px, mid ~2px, near ~1px — all get some softness
    const blurPx = Math.max(0.5, 4.5 - cw.def.scale * 1.75).toFixed(1);
    ctx.filter = `blur(${blurPx}px)`;

    ctx.drawImage(img, cw.x, y, dw, dh);
  });

  ctx.filter    = 'none';
  ctx.globalAlpha = 1;
}
