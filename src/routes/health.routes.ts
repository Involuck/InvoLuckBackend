/**
 * Health check routes for InvoLuck Backend
 * Provides system status and health monitoring endpoints
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/http';
import { db } from '../config/db';
import { verifyMailConfig } from '../config/mail';
import logger from '../config/logger';

const router = Router();

/**
 * GET /api/v1/health
 * Basic health check
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
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
  asyncHandler(async (req: Request, res: Response) => {
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
          connectionState: dbStatus,
        },
        email: {
          status: emailHealth ? 'ok' : 'error',
        },
      },
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform,
      },
    };

    // Log health check
    logger.debug({
      msg: 'Health check performed',
      status: healthData.status,
      responseTime,
      dbHealth,
      emailHealth,
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
  asyncHandler(async (req: Request, res: Response) => {
    return ok(res, {
      message: 'pong',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
