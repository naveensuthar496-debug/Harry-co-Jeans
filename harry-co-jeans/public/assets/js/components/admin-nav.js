// components/admin-nav.js — canonical admin sidebar + top-bar wiring + guard.
// Admin mockups each ship a slightly different sidebar; we replace it with one
// normalized nav so every admin page shares the same structure & active state.
import { qs, qsa, el, on, createDrawer } from '../core/ui.js';
import { ROUTES } from '../core/config.js';
import { requireStaff, logout, currentUser } from '../core/auth.js';

// key → { label, icon, href, section }
const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: ROUTES.admin.dashboard, section: 'Overview' },
  { key: 'analytics', label: 'Sales Analytics', icon: 'analytics', href: ROUTES.admin.analytics, section: 'Overview' },
  { key: 'products', label: 'Products', icon: 'app_registration', href: ROUTES.admin.products, section: 'Catalog' },
  { key: 'inventory', label: 'Inventory', icon: 'inventory_2', href: ROUTES.admin.inventory, section: 'Catalog' },
  { key: 'orders', label: 'Orders', icon: 'shopping_bag', href: ROUTES.admin.orders, section: 'Sales' },
  { key: 'customers', label: 'Customers', icon: 'group', href: ROUTES.admin.customers, section: 'Sales' },
  { key: 'promotions', label: 'Promotions', icon: 'sell', href: ROUTES.admin.promotions, section: 'Sales' },
  { key: 'loyalty', label: 'Loyalty', icon: 'workspace_premium', href: ROUTES.admin.loyalty, section: 'Engagement' },
  { key: 'rewards', label: 'Rewards Fulfillment', icon: 'redeem', href: ROUTES.admin.rewards, section: 'Engagement' },
  { key: 'loyalty-analytics', label: 'Loyalty Analytics', icon: 'insights', href: ROUTES.admin.loyaltyAnalytics, section: 'Engagement' },
  { key: 'segmentation', label: 'Segments', icon: 'segment', href: ROUTES.admin.segmentation, section: 'Engagement' },
  { key: 'kb', label: 'Knowledge Base', icon: 'article', href: ROUTES.admin.kb, section: 'Content' },
  { key: 'support', label: 'Support', icon: 'support_agent', href: ROUTES.admin.support, section: 'Content' },
];
const FOOTER = [
  { key: 'settings', label: 'Settings', icon: 'settings', href: ROUTES.admin.settings },
  { key: 'store', label: 'View Store', icon: 'storefront', href: ROUTES.home },
];

function navLink(item, activeKey) {
  const active = item.key === activeKey;
  const base = 'flex items-center gap-md px-md py-sm rounded-lg transition-colors duration-200 text-label-sm font-label-sm';
  const cls = active
    ? `${base} text-primary font-bold border-r-2 border-primary bg-surface-container`
    : `${base} text-on-surface-variant hover:text-primary hover:bg-surface-container-low`;
  return el('a', { href: item.href, class: cls }, [
    el('span', { class: 'material-symbols-outlined', text: item.icon }),
    el('span', { text: item.label }),
  ]);
}

function buildNav(activeKey) {
  const sections = [];
  let current = null;
  for (const item of NAV) {
    if (item.section !== current) {
      current = item.section;
      sections.push(el('p', {
        class: 'px-md pt-md pb-xs text-[10px] uppercase tracking-widest text-on-surface-variant/70',
        text: current,
      }));
    }
    sections.push(navLink(item, activeKey));
  }
  return el('nav', { class: 'flex-1 px-md mt-sm space-y-xs overflow-y-auto' }, sections);
}

function buildSidebarInner(activeKey) {
  return [
    el('div', { class: 'p-lg shrink-0' }, [
      el('a', { href: ROUTES.admin.dashboard, class: 'block' }, [
        el('h1', { class: 'text-headline-md font-headline-md font-bold tracking-tighter text-primary', text: 'HARRY & CO' }),
        el('p', { class: 'text-label-sm font-label-sm text-on-surface-variant mt-xs', text: 'Admin Console' }),
      ]),
    ]),
    buildNav(activeKey),
    el('div', { class: 'mt-auto p-md border-t border-outline-variant space-y-xs shrink-0' }, [
      ...FOOTER.map((f) => navLink(f, activeKey)),
      el('button', {
        class: 'w-full flex items-center gap-md px-md py-sm rounded-lg text-on-surface-variant '
          + 'hover:text-error hover:bg-error-container/40 transition-colors text-label-sm font-label-sm',
        onclick: async () => { await logout(); location.href = ROUTES.admin.login; },
      }, [
        el('span', { class: 'material-symbols-outlined', text: 'logout' }),
        el('span', { text: 'Log Out' }),
      ]),
    ]),
  ];
}

/** Replace/insert the sidebar and wire it. Returns the aside element. */
export function initAdminNav(activeKey) {
  let aside = qs('aside');
  const inner = buildSidebarInner(activeKey);
  if (aside) {
    aside.className = 'hidden md:flex flex-col h-full overflow-y-auto w-64 border-r border-outline-variant bg-background shrink-0';
    aside.innerHTML = '';
    aside.append(...inner);
  } else {
    const shell = qs('body > div.flex') || document.body;
    aside = el('aside', {
      class: 'hidden md:flex flex-col h-full overflow-y-auto w-64 border-r border-outline-variant bg-background shrink-0',
    }, buildSidebarInner(activeKey));
    shell.prepend(aside);
  }

  wireTopBar(activeKey);
  return aside;
}

// Mobile drawer clone of the sidebar, opened by the top-bar menu button.
let mobileDrawer;
function openMobileNav(activeKey) {
  if (!mobileDrawer) {
    mobileDrawer = createDrawer({ side: 'left', width: 'max-w-[280px]' });
    mobileDrawer.panel.append(...buildSidebarInner(activeKey));
    mobileDrawer.panel.classList.add('bg-background');
  }
  mobileDrawer.open();
}

function wireTopBar(activeKey) {
  const header = qs('main header') || qs('header');
  if (!header) return;

  // Mobile hamburger → open nav drawer.
  const menuBtn = qsa('.material-symbols-outlined', header)
    .find((s) => s.textContent.trim() === 'menu');
  if (menuBtn) on(menuBtn.closest('button') || menuBtn, 'click', (e) => { e.preventDefault(); openMobileNav(activeKey); });

  // Search box → product search.
  const search = qs('input[type="text"], input[type="search"]', header);
  if (search) {
    on(search, 'keydown', (e) => {
      if (e.key === 'Enter' && search.value.trim()) {
        location.href = `${ROUTES.admin.products}?q=${encodeURIComponent(search.value.trim())}`;
      }
    });
  }

  // Profile name + click → settings.
  currentUser().then((u) => {
    if (!u) return;
    const nameEl = qsa('span', header).find((s) => /Admin Profile|Profile/i.test(s.textContent));
    if (nameEl) nameEl.textContent = u.fullName || u.email;
    const profile = nameEl ? nameEl.closest('div') : null;
    if (profile) { profile.style.cursor = 'pointer'; on(profile, 'click', () => { location.href = ROUTES.admin.settings; }); }
  });
}

/** Guard + build chrome for an admin page. Returns the staff user, or null (redirecting). */
export async function initAdminChrome(activeKey) {
  const user = await requireStaff();
  if (!user) return null;
  initAdminNav(activeKey);
  return user;
}
