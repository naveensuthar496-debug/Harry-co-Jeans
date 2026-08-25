// core/format.js — presentation helpers shared by every page.
import { CURRENCY, ORDER_STATUS_LABELS } from './config.js';

/** ₹1,499 — whole-rupee, Indian digit grouping. */
export function money(rupees) {
  const n = Math.round(Number(rupees) || 0);
  return CURRENCY + n.toLocaleString('en-IN');
}

/** "Oct 20, 2024" */
export function date(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

/** "Oct 20, 2024, 10:45 AM" */
export function dateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

/** Relative time: "2 days ago", "just now". */
export function fromNow(value) {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return String(value);
  const secs = Math.round((Date.now() - then) / 1000);
  const table = [
    [60, 'second', 1],
    [3600, 'minute', 60],
    [86400, 'hour', 3600],
    [604800, 'day', 86400],
    [2592000, 'week', 604800],
    [31536000, 'month', 2592000],
    [Infinity, 'year', 31536000],
  ];
  if (secs < 45) return 'just now';
  for (const [limit, unit, div] of table) {
    if (secs < limit) {
      const n = Math.round(secs / div);
      return `${n} ${unit}${n === 1 ? '' : 's'} ago`;
    }
  }
  return date(value);
}

export function orderStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] || status;
}

/** Title-case a slug/word: "out_for_delivery" → "Out For Delivery". */
export function titleCase(s) {
  return String(s || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Build the 5 Material-Symbols star spans for a rating (0–5). */
export function starsHTML(rating, sizePx = 14) {
  const r = Number(rating) || 0;
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  let html = '';
  for (let i = 0; i < 5; i++) {
    let icon = 'star';
    let fill = 0;
    if (i < full) { fill = 1; }
    else if (i === full && half) { icon = 'star_half'; fill = 1; }
    html += `<span class="material-symbols-outlined" style="font-size:${sizePx}px;font-variation-settings:'FILL' ${fill}">${icon}</span>`;
  }
  return html;
}

export function pluralize(n, word, plural) {
  return `${n} ${n === 1 ? word : plural || word + 's'}`;
}

/** Escape user/content text for safe insertion via innerHTML. */
export function escapeHTML(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
