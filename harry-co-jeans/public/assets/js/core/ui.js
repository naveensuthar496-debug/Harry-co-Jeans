// core/ui.js — DOM helpers, toasts, drawers, template repetition.

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Create an element with attributes/children in one call. */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, val] of Object.entries(attrs)) {
    if (val === null || val === undefined || val === false) continue;
    if (k === 'class' || k === 'className') node.className = val;
    else if (k === 'html') node.innerHTML = val;
    else if (k === 'text') node.textContent = val;
    else if (k.startsWith('on') && typeof val === 'function') node.addEventListener(k.slice(2).toLowerCase(), val);
    else if (k === 'dataset') Object.assign(node.dataset, val);
    else node.setAttribute(k, val);
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined || c === false) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

export const on = (target, event, handler, opts) => target && target.addEventListener(event, handler, opts);

/** Delegated event binding: fires when the event hits `selector` inside root. */
export function delegate(root, event, selector, handler) {
  if (!root) return;
  root.addEventListener(event, (e) => {
    const match = e.target.closest(selector);
    if (match && root.contains(match)) handler(e, match);
  });
}

// ─── Toasts ──────────────────────────────────────────────────────
let toastHost;
function ensureToastHost() {
  if (!toastHost) {
    toastHost = el('div', {
      class: 'fixed z-[100] bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 items-center w-full max-w-sm px-4 pointer-events-none',
    });
    document.body.appendChild(toastHost);
  }
  return toastHost;
}

export function toast(message, type = 'info', ms = 3000) {
  const palette = {
    info: 'bg-primary text-on-primary',
    success: 'bg-primary text-on-primary',
    error: 'bg-error text-on-error',
  }[type] || 'bg-primary text-on-primary';
  const icon = { info: 'info', success: 'check_circle', error: 'error' }[type] || 'info';
  const node = el('div', {
    class: `pointer-events-auto ${palette} px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-body-md w-full transition-all duration-300 opacity-0 translate-y-2`,
    role: 'status',
  }, [
    el('span', { class: 'material-symbols-outlined text-[20px]', text: icon }),
    el('span', { class: 'flex-1', text: message }),
  ]);
  ensureToastHost().appendChild(node);
  requestAnimationFrame(() => node.classList.remove('opacity-0', 'translate-y-2'));
  setTimeout(() => {
    node.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => node.remove(), 300);
  }, ms);
  return node;
}

// ─── Slide-in drawer / overlay ───────────────────────────────────
/**
 * Generic right/left slide-in panel. Returns { open, close, root, panel }.
 * `side` = 'right' | 'left'.
 */
export function createDrawer({ side = 'right', width = 'max-w-md', panelClass = '' } = {}) {
  const panel = el('aside', {
    class: `absolute top-0 ${side}-0 h-full w-full ${width} bg-background shadow-2xl transition-transform duration-300 ease-out flex flex-col ${panelClass}`,
    style: `transform: translateX(${side === 'right' ? '100%' : '-100%'})`,
  });
  const overlay = el('div', {
    class: 'fixed inset-0 z-[90] bg-black/40 opacity-0 transition-opacity duration-300 hidden',
  }, [panel]);
  document.body.appendChild(overlay);

  function open() {
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => {
      overlay.classList.remove('opacity-0');
      panel.style.transform = 'translateX(0)';
    });
    document.body.style.overflow = 'hidden';
  }
  function close() {
    overlay.classList.add('opacity-0');
    panel.style.transform = `translateX(${side === 'right' ? '100%' : '-100%'})`;
    document.body.style.overflow = '';
    setTimeout(() => overlay.classList.add('hidden'), 300);
  }
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  return { open, close, root: overlay, panel };
}

/**
 * Render a list into `container` by cloning a template node once per item.
 * The template is the container's first element child (the hardcoded design
 * card). It's removed from the DOM and reused. `fill(clone, item, i)` wires
 * each clone. Returns the rendered nodes.
 */
export function renderList(container, items, fill, { emptyHTML } = {}) {
  if (!container) return [];
  const template = container.firstElementChild;
  container.innerHTML = '';
  if (!items || !items.length) {
    if (emptyHTML) container.innerHTML = emptyHTML;
    return [];
  }
  if (!template) return [];
  return items.map((item, i) => {
    const clone = template.cloneNode(true);
    fill(clone, item, i);
    container.appendChild(clone);
    return clone;
  });
}

/** Debounce a function by `ms`. */
export function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/** Read the current URL's query params as a plain object. */
export function params() {
  return Object.fromEntries(new URLSearchParams(location.search).entries());
}

/** Set a button into a loading state and return a restore() fn. */
export function busy(button, label = 'Please wait…') {
  if (!button) return () => {};
  const original = button.innerHTML;
  const wasDisabled = button.disabled;
  button.disabled = true;
  button.dataset.loading = '1';
  button.innerHTML = label;
  return () => {
    button.disabled = wasDisabled;
    delete button.dataset.loading;
    button.innerHTML = original;
  };
}
