// ── Feed carousel component ────────────────────────────────────────
// Fetches the Bluesky feed and renders a sliding carousel.
// Call: loadFeed(containerElement)

const FEED_URL      = 'https://fetcher-ho4joes5va-uw.a.run.app/feed?blueskyID=raineystreetgames.bsky.social';
const BLUESKY_URL   = 'https://bsky.app/profile/raineystreetgames.bsky.social';
const HANDLE        = '@raineystreetgames.bsky.social';
const AVATAR_URL    = 'https://cdn.bsky.app/img/avatar/plain/did:plc:aepnbgtci5qg7ad3s5mckkgj/bafkreigomzxrrqodl7vagtlyiclr7qgwkvme7m6p6afcef3mrrn7e3elgy@jpeg';
const MAX_ITEMS     = 10;
const AUTO_MS       = 9000;

const BLUESKY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 568 501" fill="currentColor" aria-hidden="true">
  <path d="M123.121 33.6637C188.241 82.5526 258.281 181.681 284 234.873C309.719 181.681 379.759 82.5526 444.879 33.6637C491.866 -1.61183 568 -28.9064 568 57.9464C568 75.2916 558.055 192.678 552.222 214.618C532.482 287.93 463.321 305.106 400.504 294.378C507.584 313.41 536.444 379.202 481.333 444.994C376.439 570.571 322.438 409.079 287.385 304.766C284.992 297.722 284.227 296.544 284 296.544C283.773 296.544 283.008 297.722 280.615 304.766C245.562 409.079 191.561 570.571 86.6667 444.994C31.5558 379.202 60.4165 313.41 167.496 294.378C104.679 305.106 35.518 287.93 15.7782 214.618C9.94525 192.678 0 75.2916 0 57.9464C0 -28.9064 76.1344 -1.61183 123.121 33.6637Z"/>
</svg>`;

function formatDate(ts) {
  return new Date(ts * 1000).toLocaleString('en-US', {
    month: 'numeric', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit',
    hour12: true,
  });
}

function buildPostCard(item) {
  const card = document.createElement('article');
  card.className = 'feed-card';

  // Post header — avatar + handle, using API author when present
  const authorAvatar = item.author?.avatar ?? AVATAR_URL;
  const authorHandle = item.author?.handle ?? HANDLE;
  const authorURL    = item.author?.url    ?? BLUESKY_URL;

  const header = document.createElement('div');
  header.className = 'feed-card-header';

  const avatar = document.createElement('img');
  avatar.className = 'feed-card-avatar';
  avatar.src = authorAvatar;
  avatar.alt = authorHandle;
  avatar.loading = 'lazy';
  header.appendChild(avatar);

  const authorLink = document.createElement('a');
  authorLink.className = 'feed-card-author';
  authorLink.href = authorURL;
  authorLink.target = '_blank';
  authorLink.rel = 'noopener noreferrer';
  authorLink.textContent = authorHandle;
  header.appendChild(authorLink);

  card.appendChild(header);

  if (item.media && item.media.length > 0) {
    const img = document.createElement('img');
    img.className = 'feed-card-media';
    img.src = item.media[0].url ?? item.media[0];
    img.alt = '';
    img.loading = 'lazy';
    card.appendChild(img);
  }

  const body = document.createElement('div');
  body.className = 'feed-card-body';

  if (item.content) {
    const p = document.createElement('p');
    p.className = 'feed-card-content';
    p.textContent = item.content;
    body.appendChild(p);
  }

  const footer = document.createElement('footer');
  footer.className = 'feed-card-footer';

  if (item.url) {
    const source = document.createElement('a');
    source.className = 'feed-card-source';
    source.href = item.url;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';

    const sourceText = document.createElement('span');
    sourceText.className = 'feed-card-source-text';
    sourceText.textContent = 'On Bluesky';

    const sourceIcon = document.createElement('span');
    sourceIcon.className = 'feed-card-source-icon';
    sourceIcon.innerHTML = BLUESKY_SVG;

    source.appendChild(sourceText);
    source.appendChild(sourceIcon);
    footer.appendChild(source);
  }

  const time = document.createElement('time');
  time.className = 'feed-card-date';
  time.dateTime = new Date(item.ts * 1000).toISOString();
  time.textContent = formatDate(item.ts);
  footer.appendChild(time);

  body.appendChild(footer);
  card.appendChild(body);
  return card;
}

function buildFollowCard() {
  const card = document.createElement('div');
  card.className = 'feed-card feed-card--follow';

  const inner = document.createElement('div');
  inner.className = 'feed-card-follow-inner';

  const icon = document.createElement('span');
  icon.className = 'feed-card-follow-icon';
  icon.innerHTML = BLUESKY_SVG;
  inner.appendChild(icon);

  const heading = document.createElement('div');
  heading.className = 'feed-card-follow-heading';

  const cta = document.createElement('span');
  cta.className = 'feed-card-follow-cta';
  cta.textContent = 'Follow us on Bluesky';

  heading.appendChild(cta);
  inner.appendChild(heading);

  const link = document.createElement('a');
  link.className = 'feed-card-follow-link';
  link.href = BLUESKY_URL;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = '@raineystreetgames.bsky.social';
  inner.appendChild(link);

  card.appendChild(inner);
  return card;
}

function buildArrowButton(direction) {
  const btn = document.createElement('button');
  btn.className = `feed-carousel-btn feed-carousel-${direction}`;
  btn.setAttribute('aria-label', direction === 'prev' ? 'Previous post' : 'Next post');
  btn.innerHTML = direction === 'prev' ? '&#8249;' : '&#8250;';
  return btn;
}

function buildCarousel(items) {
  const carousel = document.createElement('div');
  carousel.className = 'feed-carousel';

  // Viewport clips the sliding track; buttons live outside it
  const viewport = document.createElement('div');
  viewport.className = 'feed-carousel-viewport';

  const track = document.createElement('div');
  track.className = 'feed-carousel-track';

  items.forEach((item) => track.appendChild(buildPostCard(item)));
  track.appendChild(buildFollowCard());

  viewport.appendChild(track);
  carousel.appendChild(viewport);

  const total = items.length + 1;
  let current = 0;
  let timer = null;

  const prevBtn = buildArrowButton('prev');
  const nextBtn = buildArrowButton('next');
  carousel.appendChild(prevBtn);
  carousel.appendChild(nextBtn);

  // Returns the translateX value to center the card at `index`
  function translateX(index) {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const card = track.children[index];
    const cardW = card ? card.offsetWidth : 0;
    // Sum widths of all cards before this index
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += (track.children[i]?.offsetWidth ?? 0) + gap;
    }
    const centerOff = (viewport.offsetWidth - cardW) / 2;
    return centerOff - offset;
  }

  function goTo(index) {
    current = Math.max(0, Math.min(index, total - 1));
    track.style.transform = `translateX(${translateX(current)}px)`;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
    Array.from(track.children).forEach((card, i) => {
      card.classList.toggle('is-active', i === current);
    });
  }

  function advance() {
    goTo(current < total - 1 ? current + 1 : 0);
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(advance, AUTO_MS);
  }

  prevBtn.addEventListener('click', () => { goTo(current - 1); startTimer(); });
  nextBtn.addEventListener('click', () => { goTo(current + 1); startTimer(); });

  // Recalculate on resize so pixel offsets stay accurate
  window.addEventListener('resize', () => {
    track.style.transition = 'none';
    track.style.transform = `translateX(${translateX(current)}px)`;
    requestAnimationFrame(() => { track.style.transition = ''; });
  });

  // Defer one frame so the browser has computed layout and offsetWidth is accurate
  requestAnimationFrame(() => {
    goTo(0);
    startTimer();
  });

  return carousel;
}

async function loadFeed(container) {
  try {
    const res = await fetch(FEED_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const items = (data.items ?? []).slice(0, MAX_ITEMS);

    container.innerHTML = '';

    if (items.length === 0) {
      container.appendChild(buildFollowCard());
      return;
    }

    container.appendChild(buildCarousel(items));
  } catch (err) {
    console.error('Feed failed to load:', err);
    container.textContent = 'Could not load feed.';
  }
}
