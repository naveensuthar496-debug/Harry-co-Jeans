// components/nav-drawer.js — slide-in main navigation for storefront pages.
import { createDrawer, el, qs } from '../core/ui.js';
import { ROUTES } from '../core/config.js';
import { currentUser, logout, isStaff } from '../core/auth.js';

const LINKS = [
  { label: 'Home', href: ROUTES.home, icon: 'home' },
  { label: 'Shop All', href: ROUTES.shop, icon: 'grid_view' },
  { label: 'The Selvedge Series', href: ROUTES.selvedge, icon: 'auto_awesome' },
  { label: 'Wishlist', href: ROUTES.wishlist, icon: 'favorite' },
  { label: 'My Account', href: ROUTES.account, icon: 'person' },
  { label: 'Order History', href: ROUTES.orderHistory, icon: 'receipt_long' },
  { label: 'Help & Support', href: ROUTES.help, icon: 'help' },
];

let drawer;

export function initNavDrawer() {
  if (drawer) return drawer;
  drawer = createDrawer({ side: 'left', width: 'max-w-[320px]' });

  const list = el('nav', { class: 'flex flex-col py-md' },
    LINKS.map((l) =>
      el('a', {
        href: l.href,
        class: 'flex items-center gap-md px-lg py-md text-body-lg text-primary hover:bg-surface-container transition-colors uppercase',
      }, [
        el('span', { class: 'material-symbols-outlined', text: l.icon }),
        el('span', { text: l.label }),
      ])
    )
  );

  const authArea = el('div', { class: 'mt-auto border-t border-outline-variant p-lg flex flex-col gap-sm' });

  drawer.panel.append(
    el('div', { class: 'flex items-center justify-between px-lg h-20 border-b border-primary' }, [
      el('span', { class: 'text-headline-md font-headline-md tracking-tighter uppercase', text: 'Harry & Co' }),
      el('button', {
        class: 'hover:opacity-70', 'aria-label': 'Close menu',
        onclick: () => drawer.close(),
      }, [el('span', { class: 'material-symbols-outlined', text: 'close' })]),
    ]),
    list,
    authArea,
  );

  // Fill the auth area based on session.
  currentUser().then((user) => {
    authArea.innerHTML = '';
    if (user) {
      authArea.append(
        el('p', { class: 'text-label-sm text-secondary uppercase', text: `Signed in as ${user.fullName || user.email}` }),
        isStaff(user)
          ? el('a', { href: ROUTES.admin.dashboard, class: 'text-body-md underline text-primary', text: 'Admin Dashboard' })
          : null,
        el('button', {
          class: 'text-left text-body-md text-error underline',
          text: 'Log out',
          onclick: async () => { await logout(); location.href = ROUTES.home; },
        }),
      );
    } else {
      authArea.append(
        el('a', {
          href: ROUTES.login,
          class: 'bg-primary text-on-primary text-center py-md rounded-xl uppercase text-label-sm',
          text: 'Log In',
        }),
        el('a', {
          href: ROUTES.register,
          class: 'border border-primary text-center py-md rounded-xl uppercase text-label-sm',
          text: 'Create Account',
        }),
      );
    }
  });

  return drawer;
}
