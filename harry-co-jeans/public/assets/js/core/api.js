// core/api.js — thin fetch wrapper around the JSON API.
// Same-origin cookies carry the session, so no auth headers are needed.
import { API_BASE } from './config.js';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, headers, raw } = {}) {
  const opts = { method, credentials: 'same-origin', headers: { ...(headers || {}) } };
  if (body !== undefined) {
    if (raw) {
      opts.body = body; // FormData — let the browser set the boundary
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(API_BASE + path, opts);
  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
  }
  if (!res.ok) {
    const msg = (data && data.error) || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, data && data.details);
  }
  return data;
}

export const api = {
  get: (p, opts) => request(p, { ...opts, method: 'GET' }),
  post: (p, body, opts) => request(p, { ...opts, method: 'POST', body }),
  patch: (p, body, opts) => request(p, { ...opts, method: 'PATCH', body }),
  put: (p, body, opts) => request(p, { ...opts, method: 'PUT', body }),
  del: (p, body, opts) => request(p, { ...opts, method: 'DELETE', body }),
  upload: (p, formData, method = 'POST') => request(p, { method, body: formData, raw: true }),
};

// Build a querystring from an object, dropping null/undefined/'' values.
export function qsFromParams(params = {}) {
  const usp = new URLSearchParams();
  for (const [k, val] of Object.entries(params)) {
    if (val === null || val === undefined || val === '') continue;
    if (Array.isArray(val)) val.forEach((x) => usp.append(k, x));
    else usp.set(k, val);
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}
