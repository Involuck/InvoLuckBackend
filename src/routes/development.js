import emailService from '../services/email/emailService.js';

export function setupDevelopmentRoutes(app) {
  app.get('/test-email', async (req, res) => {
    try {
      if (!emailService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: 'Email service not configured',
          message:
            'Email service is not available. Check your RESEND_API_KEY and ADMIN_EMAIL configuration.',
          configuration: emailService.config.getStatus(),
        });
      }

      const throttleStatus = emailService.getThrottleStatus('testEmail', {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      });

      if (throttleStatus.throttled) {
        return res.status(429).json({
          success: false,
          error: 'Too Many Requests',
          message: `Test email is throttled. You must wait ${Math.ceil(throttleStatus.waitMs / 1000)} seconds before sending another test email.`,
          throttled: true,
          waitTimeSeconds: Math.ceil(throttleStatus.waitMs / 1000),
          waitTimeMinutes: Math.ceil(throttleStatus.waitMs / (1000 * 60)),
          nextAllowedTime: new Date(Date.now() + throttleStatus.waitMs).toISOString(),
          lastSent: throttleStatus.lastSent,
        });
      }

      // send test email
      const result = await emailService.sendTestEmail(
        new Date().toISOString(),
        process.env.NODE_ENV || 'development'
      );

      if (result.success) {
        return res.json({
          success: true,
          message: 'Test email sent successfully',
          emailId: result.emailId,
          timestamp: new Date().toISOString(),
        });
      } else if (result.throttled) {
        return res.status(429).json({
          success: false,
          error: 'Too Many Requests',
          message: result.message,
          throttled: true,
          waitTimeSeconds: result.waitTimeSeconds,
          waitTimeMinutes: result.waitTimeMinutes,
          nextAllowedTime: result.nextAllowedTime,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'Email sending failed',
          message: result.message || 'Failed to send test email',
        });
      }
    } catch (error) {
      console.error('❌ Test email endpoint error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while sending test email',
      });
    }
  });

  // throttle status
  app.get('/throttle-status', (req, res) => {
    try {
      const testThrottle = emailService.getThrottleStatus('testEmail', {});
      const criticalThrottle = emailService.getThrottleStatus('critical', {
        error: { name: 'TestError', message: 'Test' },
      });

      return res.json({
        success: true,
        throttleStatus: {
          testEmail: {
            throttled: testThrottle.throttled,
            waitTimeSeconds: testThrottle.throttled ? Math.ceil(testThrottle.waitMs / 1000) : 0,
            nextAllowedTime: testThrottle.throttled
              ? new Date(Date.now() + testThrottle.waitMs).toISOString()
              : null,
          },
          critical: {
            throttled: criticalThrottle.throttled,
            waitTimeSeconds: criticalThrottle.throttled
              ? Math.ceil(criticalThrottle.waitMs / 1000)
              : 0,
            nextAllowedTime: criticalThrottle.throttled
              ? new Date(Date.now() + criticalThrottle.waitMs).toISOString()
              : null,
          },
        },
        throttleSettings: {
          testEmailThrottleMinutes: emailService.throttleTimeTest / (1000 * 60),
          criticalThrottleMinutes: emailService.throttleTime / (1000 * 60),
        },
      });
    } catch (error) {
      console.error('❌ Throttle status endpoint error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get throttle status',
      });
    }
  });

  // clear throttles (dev only)
  app.post('/clear-throttles', (req, res) => {
    try {
      emailService.errorThrottle.clear();
      return res.json({
        success: true,
        message: 'All email throttles cleared',
      });
    } catch (error) {
      console.error('❌ Clear throttles endpoint error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to clear throttles',
      });
    }
  });

  app.get('/dev-info', (req, res) => {
    res.json({
      environment: 'development',
      nodeVersion: process.version,
      uptime: process.uptime(),
      envVars: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        MONGO_URI: process.env.MONGO_URI ? '***configured***' : 'not set',
        RESEND_API_KEY: process.env.RESEND_API_KEY ? '***configured***' : 'not set',
        FROM_EMAIL: process.env.FROM_EMAIL || 'not set',
        ADMIN_EMAIL: process.env.ADMIN_EMAIL ? '***configured***' : 'not set',
      },
      routes: [
        'GET /',
        'GET /health-check',
        'GET /health-detailed',
        'GET /test-email (dev only)',
        'GET /dev-info (dev only)',
        'GET /throttle-status (dev only)',
        'GET /clear-throttles (dev only)',
        'POST /api/*',
      ],
      timestamp: new Date().toISOString(),
    });
  });
}
