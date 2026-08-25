// components/chrome.js — one call to wire the shared storefront shell.
// Page scripts do `import { initChrome } from '.../components/chrome.js'`
// then `await initChrome()` before their own rendering.
import { initHeader } from './header.js';
import { initCounts } from '../core/store.js';
import { getSession } from '../core/auth.js';

let done = false;

export async function initChrome() {
  if (done) return;
  done = true;
  // Prime the session cache so header/drawers can reflect auth immediately.
  await getSession();
  initHeader();
  // Fire-and-forget: badges fill in when counts arrive.
  initCounts();
}
