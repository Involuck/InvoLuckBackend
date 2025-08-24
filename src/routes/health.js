import { getConnectionStatus } from '../config/database.js';
import emailService from '../services/email/emailService.js';

export function setupHealthRoutes(app, securityMiddleware) {
  app.get('/health-check', async (req, res) => {
    const dbInfo = getConnectionStatus();
    const dbStatus = dbInfo.status === 'connected' ? 'OK' : 'ERROR';
    const statusCode = dbInfo.status === 'connected' ? 200 : 503;

    return res.status(statusCode).json({
      status: dbStatus,
      api: dbStatus === 'OK' ? 'running' : 'not-ready',
      database: dbInfo.status,
    });
  });

  // detailed health check for monitoring services
  app.get('/health-detailed', securityMiddleware, async (req, res) => {
    const dbInfo = getConnectionStatus();
    const memoryUsage = process.memoryUsage();

    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',

      // system metrics
      system: {
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
        },
        node: process.version,
        pid: process.pid,
        platform: process.platform,
      },

      // services status
      services: {
        database: {
          status: dbInfo.status,
          readyState: dbInfo.readyState,
          host: dbInfo.host,
          attempts: dbInfo.attempts,
        },
        email: {
          configured: emailService.isConfigured(),
          provider: 'Resend',
        },
      },
    };

    res.json(healthData);
  });
}
