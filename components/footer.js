// ── Footer component ───────────────────────────────────────────────
// Populates every <footer class="site-footer"> on the page.
// Edit SOCIAL_LINKS here to update the icons on all pages at once.

const FOOTER_BASE = '/raineystreet.games';

const FOOTER_SOCIAL = [
  { href: 'https://bsky.app/profile/raineystreetgames.bsky.social', icon: FOOTER_BASE + '/assets/icons/bluesky.svg',  label: 'Bluesky' },
  { href: 'https://www.youtube.com/@raineystreetgames',          icon: FOOTER_BASE + '/assets/icons/youtube.svg',  label: 'YouTube' },
  { href: 'https://raineystreetgames.itch.io/',                      icon: FOOTER_BASE + '/assets/icons/itchio.svg',   label: 'itch.io' },
  { href: 'mailto:raineystreetgames@gmail.com',                      icon: FOOTER_BASE + '/assets/icons/email.svg',    label: 'Email' },
];

function buildFooterContent() {
  const frag = document.createDocumentFragment();

  // Icon row
  const iconRow = document.createElement('div');
  iconRow.className = 'footer-icons';

  FOOTER_SOCIAL.forEach((s) => {
    const a = document.createElement('a');
    a.href = s.href;
    a.className = 'footer-icon-link';
    a.setAttribute('aria-label', s.label);
    if (!s.href.startsWith('mailto')) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    const img = document.createElement('img');
    img.src = s.icon;
    img.alt = s.label;
    img.className = 'footer-icon';
    a.appendChild(img);
    iconRow.appendChild(a);
  });

  frag.appendChild(iconRow);

  // Copyright
  const copy = document.createElement('p');
  copy.textContent = `\u00a9 ${new Date().getFullYear()} Rainey Street Games`;
  frag.appendChild(copy);

  return frag;
}

document.querySelectorAll('footer.site-footer').forEach((el) => {
  el.innerHTML = '';
  el.appendChild(buildFooterContent());
});
