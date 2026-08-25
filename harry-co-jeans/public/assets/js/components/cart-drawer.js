// components/cart-drawer.js — slide-in shopping bag preview, synced to store.
import { createDrawer, el, renderList } from '../core/ui.js';
import { ROUTES } from '../core/config.js';
import { money } from '../core/format.js';
import { subscribe, updateCartItem, removeCartItem, loadCart } from '../core/store.js';
import { currentUser } from '../core/auth.js';

let drawer;
let unsub;

export function initCartDrawer() {
  if (drawer) return drawer;
  drawer = createDrawer({ side: 'right', width: 'max-w-md' });

  const header = el('div', { class: 'flex items-center justify-between px-lg h-20 border-b border-primary shrink-0' }, [
    el('h2', { class: 'text-headline-md font-headline-md tracking-tight uppercase', text: 'Your Bag' }),
    el('button', {
      class: 'hover:opacity-70', 'aria-label': 'Close bag',
      onclick: () => drawer.close(),
    }, [el('span', { class: 'material-symbols-outlined', text: 'close' })]),
  ]);

  const itemsWrap = el('div', { class: 'flex-1 overflow-y-auto px-lg divide-y divide-outline-variant' });
  const empty = el('div', { class: 'flex flex-col items-center justify-center h-full text-center gap-md px-lg' }, [
    el('span', { class: 'material-symbols-outlined text-[48px] text-secondary', text: 'shopping_bag' }),
    el('p', { class: 'text-body-lg text-secondary', text: 'Your bag is empty.' }),
    el('a', { href: ROUTES.shop, class: 'underline text-body-md text-primary', text: 'Continue shopping' }),
  ]);

  const subtotalRow = el('div', { class: 'flex justify-between text-body-lg font-bold' }, [
    el('span', { text: 'Subtotal' }),
    el('span', { class: 'js-subtotal', text: money(0) }),
  ]);
  const footer = el('div', { class: 'border-t border-primary p-lg flex flex-col gap-md shrink-0' }, [
    subtotalRow,
    el('p', { class: 'text-label-sm text-secondary', text: 'Shipping & taxes calculated at checkout.' }),
    el('a', {
      href: ROUTES.bag,
      class: 'block text-center bg-primary text-on-primary py-md rounded-xl uppercase text-label-sm tracking-wider hover:opacity-90',
      text: 'View Bag & Checkout',
    }),
  ]);

  const body = el('div', { class: 'flex flex-col flex-1 min-h-0' }, [itemsWrap, footer]);
  drawer.panel.append(header, body);

  function render(state) {
    const cart = state.cart || { items: [], totals: {} };
    const items = cart.items || [];
    if (!items.length) {
      body.classList.add('hidden');
      if (!drawer.panel.contains(empty)) drawer.panel.append(empty);
      return;
    }
    empty.remove();
    body.classList.remove('hidden');

    itemsWrap.innerHTML = '';
    for (const it of items) {
      itemsWrap.append(cartRow(it));
    }
    const subtotal = cart.totals?.subtotal ?? items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    subtotalRow.querySelector('.js-subtotal').textContent = money(subtotal);
  }

  unsub = subscribe(render);
  return drawer;
}

function cartRow(it) {
  return el('div', { class: 'flex gap-md py-md' }, [
    el('img', {
      src: it.imageUrl || '', alt: it.name || '',
      class: 'w-20 h-24 object-cover bg-surface-container rounded-lg shrink-0',
    }),
    el('div', { class: 'flex-1 flex flex-col' }, [
      el('div', { class: 'flex justify-between gap-sm' }, [
        el('div', {}, [
          el('p', { class: 'text-body-md font-bold leading-tight', text: it.name || 'Item' }),
          el('p', { class: 'text-label-sm text-secondary uppercase', text: [it.color, it.size].filter(Boolean).join(' · ') }),
        ]),
        el('button', {
          class: 'text-secondary hover:text-error', 'aria-label': 'Remove',
          onclick: async () => { await removeCartItem(it.id); },
        }, [el('span', { class: 'material-symbols-outlined text-[20px]', text: 'delete' })]),
      ]),
      el('div', { class: 'flex justify-between items-end mt-auto' }, [
        qtyStepper(it),
        el('span', { class: 'text-body-md font-bold', text: money(it.unitPrice * it.quantity) }),
      ]),
    ]),
  ]);
}

function qtyStepper(it) {
  const set = async (q) => { if (q >= 1) await updateCartItem(it.id, q); };
  return el('div', { class: 'flex items-center border border-outline-variant rounded-lg' }, [
    el('button', {
      class: 'w-8 h-8 flex items-center justify-center hover:bg-surface-container disabled:opacity-40',
      'aria-label': 'Decrease', disabled: it.quantity <= 1,
      onclick: () => set(it.quantity - 1),
    }, [el('span', { class: 'material-symbols-outlined text-[18px]', text: 'remove' })]),
    el('span', { class: 'w-8 text-center text-body-md', text: String(it.quantity) }),
    el('button', {
      class: 'w-8 h-8 flex items-center justify-center hover:bg-surface-container',
      'aria-label': 'Increase',
      onclick: () => set(it.quantity + 1),
    }, [el('span', { class: 'material-symbols-outlined text-[18px]', text: 'add' })]),
  ]);
}

/** Open the cart drawer, refreshing from server first (for logged-in users). */
export async function openCart() {
  const d = initCartDrawer();
  const user = await currentUser();
  if (user) await loadCart();
  d.open();
}
