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

// ── Image loading + offscreen pre-render ───────────────────────────
// Each cloud is baked (image + blur) into a small offscreen canvas once
// at load time. The draw loop then copies those — no per-frame filter
// state changes, which were causing GPU flushes and flicker.

const loadedImages = [];

function blurForScale(scale) {
  // far ~3px, mid ~2px, near ~1px
  return Math.max(0.5, 4.5 - scale * 1.75);
}

function preRenderCloud(cw, img) {
  const normalizedScale = (BASE_CLOUD_W / img.naturalWidth) * cw.def.scale;
  const dw     = Math.ceil(img.naturalWidth  * normalizedScale);
  const dh     = Math.ceil(img.naturalHeight * normalizedScale);
  const blurPx = blurForScale(cw.def.scale);
  const pad    = Math.ceil(blurPx * 4); // padding for blur edge bleed

  const off    = document.createElement('canvas');
  off.width    = dw + pad * 2;
  off.height   = dh + pad * 2;
  const offCtx = off.getContext('2d');

  offCtx.filter      = `blur(${blurPx.toFixed(1)}px)`;
  offCtx.globalAlpha = 0.88;
  offCtx.drawImage(img, pad, pad, dw, dh);

  cw.offscreen = off;
  cw.dw        = dw;
  cw.dh        = dh;
  cw.offPad    = pad;
}

CLOUD_IMAGES.forEach((src, i) => {
  loadedImages[i] = null;
  const img = new Image();
  img.onload = () => {
    loadedImages[i] = img;
    // Pre-render any cloud that uses this image
    clouds.forEach(cw => { if (cw.imgIdx === i) preRenderCloud(cw, img); });
  };
  img.onerror = () => { loadedImages[i] = null; };
  img.src = src;
});


// ── Cloud definitions ──────────────────────────────────────────────
// baseYvh: vertical position as fraction of viewport height (can exceed 1.0)
// scale:   display size multiplier
// rate:    parallax + drift speed (higher = closer/faster)

const isMobile = window.innerWidth < 768;

// Clouds are grouped into far/mid/near layers, then sorted by scale
// so larger clouds always render in front of smaller ones.

const FAR_CLOUDS = [
  { baseYvh: 0.62, scale: 0.72, rate: 0.22 },
  { baseYvh: 0.80, scale: 0.80, rate: 0.24 },
  { baseYvh: 0.98, scale: 0.75, rate: 0.23 },
  { baseYvh: 1.16, scale: 0.68, rate: 0.21 },
];

const MID_CLOUDS = [
  { baseYvh: 0.70, scale: 1.25, rate: 0.36 },
  { baseYvh: 0.86, scale: 1.40, rate: 0.40 },
  { baseYvh: 1.02, scale: 1.30, rate: 0.37 },
  { baseYvh: 1.18, scale: 1.45, rate: 0.42 },
  { baseYvh: 1.30, scale: 1.20, rate: 0.35 },
];

const NEAR_CLOUDS = [
  { baseYvh: 0.78, scale: 1.90, rate: 0.55 },
  { baseYvh: 0.96, scale: 2.10, rate: 0.60 },
  { baseYvh: 1.13, scale: 1.85, rate: 0.57 },
  { baseYvh: 1.30, scale: 2.20, rate: 0.63 },
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

const clouds = [];

if (cloudCanvas) {
  const total = CLOUD_DEFS.length;
  CLOUD_DEFS.forEach((def, i) => {
    const zoneW  = cloudVW / total;
    const startX = i * zoneW + Math.random() * zoneW;
    const imgIdx = Math.floor(Math.random() * CLOUD_IMAGES.length);
    clouds.push({ def, x: startX, speed: driftSpeed(def.rate), imgIdx });
  });

  // Smallest scale first so larger clouds render in front.
  clouds.sort((a, b) => a.def.scale - b.def.scale);

  // Pre-render clouds whose images already landed in the browser cache.
  clouds.forEach(cw => {
    const img = loadedImages[cw.imgIdx];
    if (img) preRenderCloud(cw, img);
  });
}


// ── Draw function (called each frame by main.js) ───────────────────

function drawClouds(scrollY) {
  if (!ctx || clouds.length === 0) return;

  const vw = cloudVW;
  const vh = cloudVH;

  ctx.clearRect(0, 0, vw, vh);

  clouds.forEach((cw) => {
    if (!cw.offscreen) return; // still loading

    cw.x += cw.speed * cloudDirection;

    const dw = cw.dw, dh = cw.dh, pad = cw.offPad;

    if (cloudDirection > 0 && cw.x > vw) {
      cw.x = -dw;
    } else if (cloudDirection < 0 && cw.x + dw < 0) {
      cw.x = vw;
    }

    const y = cw.def.baseYvh * vh - scrollY * cw.def.rate;
    if (y + dh < 0 || y > vh) return;

    ctx.drawImage(cw.offscreen, cw.x - pad, y - pad);
  });
}
