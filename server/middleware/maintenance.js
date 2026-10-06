import { db } from '../config/database.js';

export function checkMaintenanceMode(req, res, next) {
  // Always permit admin routes, admin page, static assets, and auth check
  const path = req.path;
  if (
    path.startsWith('/admin') ||
    path.startsWith('/api/v1/admin') ||
    path.startsWith('/css') ||
    path.startsWith('/js') ||
    path.startsWith('/uploads') ||
    path.startsWith('/assets') ||
    path === '/api/v1/settings'
  ) {
    return next();
  }

  const row = db.prepare("SELECT value FROM settings WHERE key = 'maintenance_mode'").get();
  const isMaintenance = row && row.value === 'true';

  if (isMaintenance) {
    if (path.startsWith('/api/')) {
      return res.status(503).json({
        success: false,
        maintenance: true,
        message: 'The Harry & Co Atelier is currently undergoing scheduled maintenance. Please check back shortly.'
      });
    }
  }

  next();
}
