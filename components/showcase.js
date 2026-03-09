// ── Showcase component ──────────────────────────────────────────────
// Renders a focus-on-hover video grid for interactive pieces.
//
// To add / remove / reorder items: edit SHOWCASE_ITEMS below.
// Set disabled: true to exclude an item without deleting it.
// Video files must live at: assets/videos/{slug}.mp4
//
// Call: buildShowcase(containerElement)

const SHOWCASE_CYCLE_MS = 7000;

const SHOWCASE_ITEMS = [
  { slug: 'transport', title: 'Transportation Day', link: 'games/transportationday/' },
  { slug: 'wubs',      title: 'Wubs',               link: 'games/wubs/' },
  { slug: 'boxster',   title: 'Boxster',             link: 'games/boxster/' },
  // { slug: 'kithwind', title: 'Kithwind', link: 'games/kithwind/', disabled: true },
];

function buildShowcase(container) {
  const items = SHOWCASE_ITEMS.filter(i => !i.disabled);
  if (items.length === 0) return;

  const grid = document.createElement('div');
  grid.className = 'showcase-grid';

  let focusedIdx = 0;

  const cells = items.map((item, idx) => {
    const cell = document.createElement('div');
    cell.className = 'showcase-cell' + (idx === 0 ? ' is-focused' : '');

    // Wrap in a link if we have one
    const inner = item.link ? document.createElement('a') : document.createElement('div');
    inner.className = 'showcase-inner';
    if (item.link) {
      inner.href = item.link;
    }

    const video = document.createElement('video');
    video.className = 'showcase-video';
    video.src = `assets/videos/${item.slug}.mp4`;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';

    inner.appendChild(video);
    cell.appendChild(inner);

    return { cell, video };
  });

  let isHovered = false;
  let cycleTimer = null;

  function focusCell(idx) {
    if (idx === focusedIdx) return;

    cells[focusedIdx].video.pause();
    cells[focusedIdx].cell.classList.remove('is-focused');

    focusedIdx = idx;
    cells[focusedIdx].cell.classList.add('is-focused');
    cells[focusedIdx].video.play().catch(() => {});
  }

  function advance() {
    focusCell((focusedIdx + 1) % cells.length);
  }

  function startCycle() {
    clearInterval(cycleTimer);
    cycleTimer = setInterval(() => {
      if (!isHovered) advance();
    }, SHOWCASE_CYCLE_MS);
  }

  cells.forEach(({ cell }, idx) => {
    cell.addEventListener('mouseenter', () => {
      isHovered = true;
      focusCell(idx);
    });
    cell.addEventListener('mouseleave', () => {
      isHovered = false;
    });
    // Touch / keyboard: click focuses (without following the link if not already focused)
    cell.addEventListener('click', (e) => {
      if (idx !== focusedIdx) {
        e.preventDefault();
        focusCell(idx);
      }
    });
    grid.appendChild(cell);
  });

  startCycle();

  // Insert into DOM first — browsers won't load metadata for off-DOM videos
  container.appendChild(grid);

  // Seek each video to a random point, then play the first.
  // Must wait for 'seeked' before play() — otherwise the browser starts from 0.
  cells.forEach(({ video }, idx) => {
    function doSeekAndMaybePlay() {
      if (!video.duration || !isFinite(video.duration)) return;
      video.currentTime = Math.random() * video.duration;
      if (idx === 0) {
        video.addEventListener('seeked', () => video.play().catch(() => {}), { once: true });
      }
    }

    if (video.readyState >= 1) {
      doSeekAndMaybePlay();
    } else {
      video.addEventListener('loadedmetadata', doSeekAndMaybePlay, { once: true });
    }
  });
}
