# Rainey Street Games — CLAUDE.md

## Project overview

Static website for Rainey Street Games, deployed to GitHub Pages at
`https://raineystreetgames.github.io/raineystreet.games/`.

No build step, no framework, no npm. Pure HTML + vanilla JS + CSS.
All pages share a `<base href="/raineystreet.games/">` tag so asset paths
are relative to the repo root regardless of URL depth.

## Local dev

```
make run   # starts python3 HTTP server at http://localhost:8088/raineystreet.games/
```

## Deployment

Push to `main` → GitHub Actions (`.github/workflows/pages.yml`) uploads the
entire repo root as a Pages artifact and deploys automatically.

---

## Site structure

### Pages

| URL | File | Notes |
|-----|------|-------|
| `/` | `index.html` | Home — hero scroll, cloud canvas, Bluesky feed carousel, game showcase |
| `/about` | `about/index.html` | About Jesse + studio + contact. Background: Sage Dark `#2f7e62` |
| `/games` | `games/index.html` | Game capsule grid listing all games |
| `/games/kithwind` | `games/kithwind/index.html` | Kithwind series hub. Background: Slate Blue `#4870b8` |
| `/games/kithwind/wilds` | `games/kithwind/wilds/index.html` | Kithwind: Wilds game page. Background: Amber `#c08840` |
| `/games/kithwind/legends` | `games/kithwind/legends/index.html` | Kithwind: Legends game page. Background: Ember `#b06040` |
| `/games/dungeons` | `games/dungeons/index.html` | Dungeon Buddies (Unity WebGL embed) |
| `/games/wubs` | `games/wubs/index.html` | Wubs (Unity WebGL embed) |
| `/games/transportationday` | `games/transportationday/index.html` | Transportation Day (Unity WebGL embed) |
| `/games/boxster` | `games/boxster/index.html` | Boxster (Unity WebGL embed) |
| `/games/beneaththesurface` | `games/beneaththesurface/index.html` | Beneath the Surface (Unity WebGL embed) |

`palette.html` — local-only color reference (not deployed).

### Game builds

Each Unity game lives at `games/{slug}/build/` with the standard Unity WebGL
output (`Build/Web.data`, `Web.framework.js`, `Web.loader.js`, `Web.wasm`).
The game wrapper page is at `games/{slug}/index.html`.

---

## Components (vanilla JS, injected into pages)

All components are plain JS files loaded via `<script src="components/...">`.
They write directly to the DOM — no bundler, no imports.

### `components/nav.js`
- Defines `NAV_ITEMS` array — edit here to add/remove pages or dropdowns.
- Builds the `.topbar` nav, injects it as the first element in `<body>`.
- Social icon links (Bluesky, YouTube, itch.io) are desktop-only in the nav.
- Supports: hamburger mobile menu, hover dropdowns, nested submenus, keyboard Escape close.
- `BASE = '/raineystreet.games'` used for all internal hrefs.

### `components/footer.js`
- Defines `FOOTER_SOCIAL` — social links (Bluesky, YouTube, itch.io, Email).
- Populates every `<footer class="site-footer">` on the page.
- Renders an icon row + copyright year.

### `components/feed.js`
- Fetches Bluesky posts from the Cloud Run fetcher API:
  `https://fetcher-ho4joes5va-uw.a.run.app/feed?blueskyID=raineystreetgames.bsky.social`
- Renders up to 10 posts as a sliding carousel with prev/next arrows and auto-advance (9 s).
- Appends a "Follow us on Bluesky" card at the end of the carousel.
- Falls back to just the follow card if the fetch fails or returns no items.
- Call: `loadFeed(containerElement)`

### `components/showcase.js`
- `SHOWCASE_ITEMS` array — each entry has `slug`, `title`, `link` (and optional `disabled: true`).
- Video files must be at `assets/videos/{slug}.mp4`.
- Renders a focus-on-hover video grid; auto-cycles every 7 s when not hovered.
- Touch/click on unfocused cell focuses it without following the link.
- Active games: Transportation Day, Wubs, Boxster. Kithwind is disabled/commented out.
- Call: `buildShowcase(containerElement)`

### `components/clouds.js`
- Canvas-based cloud renderer; reads `#cloud-layer` canvas on the home page.
- 6 cloud PNGs from `assets/clouds/cloud{1-6}.png`.
- Three depth layers (far/mid/near) with parallax scroll and drift animation.
- Mobile: 6 clouds (2 per layer); desktop: 13 clouds.
- Exposes `drawClouds(scrollY)` — called by `static/main.js` animation loop.

---

## Static files

### `static/main.js`
- Scroll-driven background color gradient (home: Sky Blue → Deep Blue).
- Per-page fixed background colors set via CSS `--bg` variable.
  - `/about` → Sage Dark `#2f7e62`
  - `/games/kithwind` → Slate Blue `#4870b8`
  - `/games/kithwind/wilds` → Amber `#c08840`
  - `/games/kithwind/legends` → Ember `#b06040`
  - All others default to Deep Blue `#3780c6`
- Logo parallax + fade-out on scroll (home only).
- Single rAF animation loop: clouds (~48 fps cap) + background + logo.
- IntersectionObserver for `[data-animate]` scroll-triggered animations (`fade-up`, `slide-left`, `slide-right`).

### `static/style.css`
- Global stylesheet for all pages.
- Uses CSS custom property `--bg` (RGB triplet) set by `main.js` for the page background.
- Key layout classes: `.topbar`, `.hero-scroll`, `.hero-stage`, `.glass-panel`, `.content-flow`, `.bottom-scene`, `.site-footer`, `.section`, `.page-hero`, `.game-capsule`, `.game-card`, `.feed-carousel`, `.showcase-grid`.
- Font: Bebas Neue (Google Fonts, headings only).

---

## Assets

| Path | Purpose |
|------|---------|
| `assets/logo.png` | Hero wordmark on home page |
| `assets/icon.png` | Nav bar brand icon |
| `assets/favicon/` | Favicon set (ico, png, apple-touch, webmanifest) |
| `assets/icons/bluesky.svg` | Social icon |
| `assets/icons/youtube.svg` | Social icon |
| `assets/icons/itchio.svg` | Social icon |
| `assets/icons/email.svg` | Social icon |
| `assets/clouds/cloud{1-6}.png` | Cloud layer PNGs |
| `assets/scenes/footer.svg` | (legacy) footer scene |
| `assets/scenes/home.png` | Bottom scene image on home page |
| `assets/videos/{slug}.mp4` | Showcase videos (transport, wubs, boxster) |
| `about/jesse_photo.jpeg` | Primary photo on about page |
| `about/jesse_{pixel,poly,paint,cartoon}.png` | Hover/mobile-cycle variants on about page |

---

## Home page features

1. **Cloud canvas** — fixed-position `<canvas id="cloud-layer">` drifts parallax clouds.
2. **Hero scroll zone** — 500 vh sticky container; logo fades + parallaxes on scroll.
3. **Bluesky feed carousel** — fetches live posts, prev/next arrows, auto-advances.
4. **Game showcase** — auto-cycling video grid linked to game pages.
5. **Bottom scene** — decorative `home.png` above the footer.

## About page features

1. Two-column layout: bio text + photo.
2. **Photo hover effect** — desktop: hover shows an alternate variant image; mobile: auto-cycles through all variants every 5 s with crossfade.
3. Three sections: About Me, About the Studio, Contact.

---

## Conventions

- Every page loads `components/nav.js` first (self-executing, no function call needed).
- Every page loads `components/footer.js` and has `<footer class="site-footer"></footer>`.
- Every page loads `static/main.js` last for scroll effects and animations.
- Add `data-animate="fade-up"` (or `slide-left` / `slide-right`) to elements that should animate in on scroll.
- Use `style="--delay: 0.Xs"` to stagger animations.
- Per-page background color: add an entry to `PAGE_COLORS` in `static/main.js`.
- To add a nav item: edit `NAV_ITEMS` in `components/nav.js`.
- To add a game to the showcase: add an entry to `SHOWCASE_ITEMS` in `components/showcase.js` and drop a `{slug}.mp4` in `assets/videos/`.
- To add a social link: edit `FOOTER_SOCIAL` in `components/footer.js` (and `socialLinks` in `components/nav.js` for the nav icons).
