import { Router } from 'express';

import { db } from '../config/db.js';
import logger from '../config/logger.js';
import { verifyMailConfig } from '../config/mail.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/http.js';

import type { Request, Response } from 'express';

const router = Router();

/**
 * GET /api/v1/health
 * Basic health check
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime()
    };

    return ok(res, healthData);
  })
);

/**
 * GET /api/v1/health/detailed
 * Detailed health check with service dependencies
 */
router.get(
  '/detailed',
  asyncHandler(async (_req: Request, res: Response) => {
    const startTime = Date.now();

    // Check database connection
    const dbHealth = await db.isHealthy();
    const dbStatus = db.getConnectionStatus();

    // Check email service
    const emailHealth = await verifyMailConfig();

    // Calculate response time
    const responseTime = Date.now() - startTime;

    const healthData = {
      status: dbHealth && emailHealth ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      services: {
        database: {
          status: dbHealth ? 'ok' : 'error',
          connectionState: dbStatus
        },
        email: {
          status: emailHealth ? 'ok' : 'error'
        }
      },
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    // Log health check
    logger.debug({
      msg: 'Health check performed',
      status: healthData.status,
      responseTime,
      dbHealth,
      emailHealth
    });

    const statusCode = healthData.status === 'ok' ? 200 : 503;
    return ok(res, healthData, statusCode);
  })
);

/**
 * GET /api/v1/health/ping
 * Simple ping endpoint
 */
router.get(
  '/ping',
  asyncHandler(async (_req: Request, res: Response) => {
    return ok(res, {
      message: 'pong',
      timestamp: new Date().toISOString()
    });
  })
);

export default router;
