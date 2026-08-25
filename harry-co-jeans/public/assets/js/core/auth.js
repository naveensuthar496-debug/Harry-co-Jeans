// core/auth.js — session state + route guards, shared across all pages.
import { api } from './api.js';
import { ROUTES } from './config.js';

let _session; // cached { user } after first fetch

/** Fetch the current session once and cache it. Force with {refresh:true}. */
export async function getSession({ refresh = false } = {}) {
  if (_session && !refresh) return _session;
  try {
    _session = await api.get('/auth/me');
  } catch {
    _session = { user: null };
  }
  return _session;
}

export async function currentUser(opts) {
  return (await getSession(opts)).user;
}

export function isStaff(user) {
  return !!user && ['admin', 'manager', 'editor'].includes(user.role);
}

/** Redirect to login (preserving return path) unless a customer is signed in. */
export async function requireCustomer() {
  const user = await currentUser();
  if (!user) {
    location.href = `${ROUTES.login}?next=${encodeURIComponent(location.pathname + location.search)}`;
    return null;
  }
  return user;
}

/** Guard an admin page: must be signed-in staff, else bounce to admin login. */
export async function requireStaff() {
  const user = await currentUser();
  if (!isStaff(user)) {
    location.href = `${ROUTES.admin.login}?next=${encodeURIComponent(location.pathname + location.search)}`;
    return null;
  }
  return user;
}

export async function login(email, pw) {
  const res = await api.post('/auth/login', { email, password: pw });
  _session = { user: res.user };
  return res.user;
}

export async function register(payload) {
  const res = await api.post('/auth/register', payload);
  _session = { user: res.user };
  return res.user;
}

export async function logout() {
  try { await api.post('/auth/logout'); } catch { /* ignore */ }
  _session = { user: null };
}
