// components/header.js — wires the storefront top bar + bottom nav on every page.
// Binds to the static mockup markup by aria-label and Material-Symbols icon text,
// so it works across pages whose headers differ slightly.
import { qs, qsa, el, on } from '../core/ui.js';
import { ROUTES } from '../core/config.js';
import { subscribe } from '../core/store.js';
import { initNavDrawer } from './nav-drawer.js';
import { openCart, initCartDrawer } from './cart-drawer.js';

/** Find a header/nav button by aria-label or by the icon text it contains. */
function findButton(root, { label, icon }) {
  const byLabel = label && qs(`button[aria-label="${label}"], a[aria-label="${label}"]`, root);
  if (byLabel) return byLabel;
  if (!icon) return null;
  const iconSpan = qsa('button .material-symbols-outlined, a .material-symbols-outlined', root)
    .find((s) => s.textContent.trim() === icon);
  return iconSpan ? iconSpan.closest('button, a') : null;
}

export function initHeader() {
  const header = qs('header');
  initNavDrawer();
  initCartDrawer();

  // ── Menu button → nav drawer ──
  const menuBtn = findButton(header || document, { label: 'Menu', icon: 'menu' });
  if (menuBtn) on(menuBtn, 'click', (e) => { e.preventDefault(); initNavDrawer().open(); });

  // ── Brand wordmark → home ──
  const brand = header && (qs('h1', header) || qs('h2', header));
  if (brand && !brand.closest('a')) {
    brand.style.cursor = 'pointer';
    on(brand, 'click', () => { location.href = ROUTES.home; });
  }

  // ── Cart button → cart drawer, with live badge ──
  const cartBtn = findButton(header || document, { label: 'Cart', icon: 'shopping_bag' });
  if (cartBtn) {
    cartBtn.classList.add('relative');
    on(cartBtn, 'click', (e) => { e.preventDefault(); openCart(); });
    const badge = el('span', {
      class: 'js-cart-badge absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center '
        + 'bg-primary text-on-primary text-[10px] font-bold rounded-full leading-none hidden',
    });
    cartBtn.appendChild(badge);
    subscribe((state) => {
      const n = state.cartCount || 0;
      badge.textContent = String(n);
      badge.classList.toggle('hidden', n === 0);
    });
  }

  wireBottomNav();
}

// The mobile bottom nav: Home / Shop / New / Account, matched by icon.
const BOTTOM_NAV = {
  home: ROUTES.home,
  grid_view: ROUTES.shop,
  auto_awesome: ROUTES.selvedge,
  person: ROUTES.account,
};

function wireBottomNav() {
  const nav = qs('nav.fixed.bottom-0') || qsa('nav').find((n) => n.className.includes('bottom-0'));
  if (!nav) return;
  for (const btn of qsa('button, a', nav)) {
    const iconEl = qs('.material-symbols-outlined', btn);
    const icon = iconEl && iconEl.textContent.trim();
    const href = BOTTOM_NAV[icon];
    if (!href) continue;
    on(btn, 'click', (e) => { e.preventDefault(); location.href = href; });
  }
}
