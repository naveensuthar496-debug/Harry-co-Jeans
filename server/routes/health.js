/**
 * HARRY & CO JEANS - PRODUCTION HEALTH CHECK & PROBE ROUTE
 * Provides secure health checks for Reverse Proxy (Nginx), Azure Front Door,
 * and Docker health probes without leaking internal IP or system specifics.
 */

import express from 'express';
import { db } from '../config/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    // Quick DB liveness check
    const dbCheck = db.prepare('SELECT 1 as healthy').get();
    const isDbHealthy = dbCheck && dbCheck.healthy === 1;

    if (!isDbHealthy) {
      return res.status(503).json({
        status: 'UNHEALTHY',
        database: 'DISCONNECTED',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      status: 'HEALTHY',
      service: 'Harry & Co Atelier API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime())
    });
  } catch (err) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Service check failed',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
