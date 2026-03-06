// ── Nav component ──────────────────────────────────────────────────
// Edit NAV_ITEMS to add pages, dropdowns, and submenus.
// This file is loaded by every page — changes here apply everywhere.

const BASE = '/raineystreet.games';

const NAV_ITEMS = [
  {
    label: 'Games',
    href: '/games',
    dropdown: [
      {
        label: 'Kithwind',
        href: '/games/kithwind',
        submenu: [
          { label: 'Wilds',   href: '/games/kithwind/wilds' },
          { label: 'Legends', href: '/games/kithwind/legends' },
        ],
      },
      // Add future games here (without a submenu array for standalone entries)
      // { label: 'New Game Title', href: '/new-game' },
    ],
  },
  { label: 'About', href: '/about' },
];


// ── Build nav HTML ─────────────────────────────────────────────────

function buildDropdownItem(item) {
  const hasSubmenu = item.submenu && item.submenu.length > 0;

  const li = document.createElement('li');
  li.setAttribute('role', 'none');
  if (hasSubmenu) li.classList.add('has-submenu');

  // Link — always navigates
  const a = document.createElement('a');
  a.href = item.href ? BASE + item.href : '#';
  a.setAttribute('role', 'menuitem');
  a.textContent = item.label;
  li.appendChild(a);

  if (hasSubmenu) {
    // Arrow button for mobile / explicit toggle
    const arrow = document.createElement('button');
    arrow.className = 'submenu-toggle';
    arrow.setAttribute('aria-label', `${item.label} sub-menu`);
    arrow.textContent = '›';
    li.appendChild(arrow);

    // Submenu list
    const sub = document.createElement('ul');
    sub.className = 'submenu';
    sub.setAttribute('role', 'menu');
    item.submenu.forEach((subItem) => {
      const subLi = document.createElement('li');
      subLi.setAttribute('role', 'none');
      const subA = document.createElement('a');
      subA.href = subItem.href ? BASE + subItem.href : '#';
      subA.setAttribute('role', 'menuitem');
      subA.textContent = subItem.label;
      subLi.appendChild(subA);
      sub.appendChild(subLi);
    });
    li.appendChild(sub);
  }

  return li;
}

function buildNav() {
  const nav = document.createElement('nav');
  nav.className = 'topbar';

  // Brand icon
  const brand = document.createElement('a');
  brand.className = 'topbar-brand';
  brand.href = BASE + '/';

  const brandImg = document.createElement('img');
  brandImg.src = BASE + '/assets/icon.png';
  brandImg.alt = 'Rainey Street Games';
  brandImg.className = 'topbar-brand-img';
  brand.appendChild(brandImg);

  nav.appendChild(brand);

  // Hamburger button (mobile only — hidden via CSS on desktop)
  const hamburger = document.createElement('button');
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('aria-label', 'Open menu');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '<span></span><span></span><span></span>';
  nav.appendChild(hamburger);

  // Tab list
  const ul = document.createElement('ul');
  ul.className = 'topbar-links';

  NAV_ITEMS.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'nav-item';

    if (item.dropdown) {
      // Dropdown parent — clickable link that also has a hover dropdown
      li.classList.add('has-dropdown');
      const a = document.createElement('a');
      a.className = 'nav-tab';
      a.href = item.href ? BASE + item.href : '#';
      a.setAttribute('aria-expanded', 'false');
      a.setAttribute('aria-haspopup', 'true');
      a.textContent = item.label;
      li.appendChild(a);

      // Dropdown list
      const dropdown = document.createElement('ul');
      dropdown.className = 'dropdown';
      dropdown.setAttribute('role', 'menu');
      item.dropdown.forEach((child) => {
        dropdown.appendChild(buildDropdownItem(child));
      });
      li.appendChild(dropdown);
    } else {
      // Plain link tab
      const a = document.createElement('a');
      a.className = 'nav-tab';
      a.href = item.href ? BASE + item.href : '#';
      a.textContent = item.label;
      li.appendChild(a);
    }

    ul.appendChild(li);
  });

  // Social icon tabs
  const socialLinks = [
    { href: 'https://bsky.app/profile/raineystreetgames.bsky.social', icon: BASE + '/assets/icons/bluesky.svg', label: 'Bluesky' },
    { href: 'https://www.youtube.com/@raineystreetgames3671', icon: BASE + '/assets/icons/youtube.svg', label: 'YouTube' },
  ];

  socialLinks.forEach((s) => {
    const li = document.createElement('li');
    li.className = 'nav-item';
    const a = document.createElement('a');
    a.className = 'nav-tab';
    a.href = s.href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', s.label);
    const img = document.createElement('img');
    img.src = s.icon;
    img.alt = s.label;
    img.className = 'nav-social-icon';
    a.appendChild(img);
    li.appendChild(a);
    ul.appendChild(li);
  });

  nav.appendChild(ul);
  return nav;
}

// Insert nav as first element in body
document.body.insertAdjacentElement('afterbegin', buildNav());


// ── Nav interactivity ──────────────────────────────────────────────


function closeMenu() {
  const topbar = document.querySelector('.topbar');
  const hb = document.querySelector('.nav-hamburger');
  topbar.classList.remove('is-menu-open');
  if (hb) {
    hb.classList.remove('is-open');
    hb.setAttribute('aria-expanded', 'false');
  }
}

function closeAllDropdowns() {
  document.querySelectorAll('.nav-item.is-open').forEach((el) => {
    el.classList.remove('is-open');
    const btn = el.querySelector('[aria-expanded]');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  });
}

function closeAllSubmenus() {
  document.querySelectorAll('.has-submenu.is-open').forEach((el) => {
    el.classList.remove('is-open');
  });
}

// Hamburger toggle
document.querySelector('.nav-hamburger').addEventListener('click', (e) => {
  e.stopPropagation();
  const topbar = document.querySelector('.topbar');
  const hb = e.currentTarget;
  const opening = !topbar.classList.contains('is-menu-open');
  if (opening) {
    topbar.classList.add('is-menu-open');
    hb.classList.add('is-open');
    hb.setAttribute('aria-expanded', 'true');
  } else {
    closeMenu();
    closeAllDropdowns();
    closeAllSubmenus();
  }
});

// Top-level dropdown toggles
document.addEventListener('click', (e) => {
  // Top-level: "Games" tab — first click opens, second click navigates
  const dropTab = e.target.closest('.has-dropdown > .nav-tab');
  if (dropTab) {
    const li = dropTab.closest('.has-dropdown');
    const isOpen = li.classList.contains('is-open');
    if (!isOpen) {
      e.preventDefault();
      closeAllDropdowns();
      closeAllSubmenus();
      li.classList.add('is-open');
    } else {
      // Already open: navigate
      closeAllDropdowns();
      closeAllSubmenus();
    }
    return;
  }

  // Submenu link (e.g. "Kithwind") — first click opens, second click navigates
  const subLink = e.target.closest('.has-submenu > a');
  if (subLink) {
    const subItem = subLink.closest('.has-submenu');
    const isOpen = subItem.classList.contains('is-open');
    if (!isOpen) {
      e.preventDefault();
      closeAllSubmenus();
      subItem.classList.add('is-open');
    }
    // Already open: navigate normally
    e.stopPropagation(); // don't close parent dropdown
    return;
  }

  // Submenu arrow button (alternate toggle)
  const arrowBtn = e.target.closest('.submenu-toggle');
  if (arrowBtn) {
    const subItem = arrowBtn.closest('.has-submenu');
    const isOpen = subItem.classList.contains('is-open');
    closeAllSubmenus();
    if (!isOpen) subItem.classList.add('is-open');
    e.stopPropagation();
    return;
  }

  // Clicking a leaf nav link in mobile drawer → close menu
  const navLink = e.target.closest('.topbar-links a');
  if (navLink) {
    closeMenu();
    closeAllDropdowns();
    closeAllSubmenus();
    return;
  }

  // Click outside — close everything
  closeMenu();
  closeAllDropdowns();
  closeAllSubmenus();
});

// Escape key closes everything
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMenu();
    closeAllDropdowns();
    closeAllSubmenus();
  }
});
