// core/store.js — client-side cart & wishlist state + header badge sync.
// The server is the source of truth; this caches counts and broadcasts
// changes so headers/drawers update everywhere without a reload.
import { api } from './api.js';
import { currentUser } from './auth.js';

const listeners = new Set();
let state = { cart: null, wishlist: null, cartCount: 0, wishlistCount: 0 };

function emit() {
  for (const fn of listeners) fn(state);
  document.dispatchEvent(new CustomEvent('store:change', { detail: state }));
}

/** Subscribe to store changes; returns an unsubscribe fn. */
export function subscribe(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

export function getState() { return state; }

function cartCount(cart) {
  return (cart && cart.items ? cart.items : []).reduce((n, i) => n + i.quantity, 0);
}

// ─── Cart ────────────────────────────────────────────────────────
export async function loadCart() {
  const user = await currentUser();
  if (!user) { state = { ...state, cart: { items: [], totals: {} }, cartCount: 0 }; emit(); return state.cart; }
  const cart = await api.get('/cart');
  state = { ...state, cart, cartCount: cartCount(cart) };
  emit();
  return cart;
}

export async function addToCart(variantId, quantity = 1) {
  const cart = await api.post('/cart', { variantId, quantity });
  state = { ...state, cart, cartCount: cartCount(cart) };
  emit();
  return cart;
}

export async function updateCartItem(itemId, quantity) {
  const cart = await api.patch(`/cart/${itemId}`, { quantity });
  state = { ...state, cart, cartCount: cartCount(cart) };
  emit();
  return cart;
}

export async function removeCartItem(itemId) {
  const cart = await api.del(`/cart/${itemId}`);
  state = { ...state, cart, cartCount: cartCount(cart) };
  emit();
  return cart;
}

// ─── Wishlist ────────────────────────────────────────────────────
export async function loadWishlist() {
  const user = await currentUser();
  if (!user) { state = { ...state, wishlist: { items: [] }, wishlistCount: 0 }; emit(); return state.wishlist; }
  const wishlist = await api.get('/wishlist');
  state = { ...state, wishlist, wishlistCount: (wishlist.items || []).length };
  emit();
  return wishlist;
}

export async function toggleWishlist(productId) {
  const res = await api.post('/wishlist/toggle', { productId });
  await loadWishlist();
  return res; // { inWishlist: bool }
}

export async function removeWishlist(productId) {
  await api.del(`/wishlist/${productId}`);
  return loadWishlist();
}

/** Prime cart+wishlist counts for header badges (safe when logged out). */
export async function initCounts() {
  const user = await currentUser();
  if (!user) { emit(); return; }
  await Promise.allSettled([loadCart(), loadWishlist()]);
}
