import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, isDevelopment } from './env.js';
import logger from './logger.js';

import type { Request, Response } from 'express';

const safeIpKeyGenerator = (req: Request): string => {
  // express-rate-limit
  return ipKeyGenerator(req as any);
};

// Custom rate limit handler
const rateLimitHandler = (req: Request, res: Response): void => {
  logger.warn({
    msg: 'Rate limit exceeded',
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    path: req.path,
    method: req.method
  });

  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
      retryAfter: Math.round(RATE_LIMIT_WINDOW_MS / 1000)
    },
    requestId: (req as any).id
  });
};

// Skip rate limiting function
const skipRateLimit = (req: Request): boolean => {
  if (isDevelopment()) {
    const skipPaths = ['/api/v1/health', '/api/v1/docs'];
    return skipPaths.some(path => req.path.startsWith(path));
  }
  return false;
};

// General rate limiter configuration
const generalRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  keyGenerator: (req: Request) => {
    if (typeof (req as any).user?.id === 'string' && (req as any).user.id.length > 0) {
      return (req as any).user.id;
    }
    return safeIpKeyGenerator(req);
  }
});

// Strict rate limiter for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  handler: (req: Request, res: Response) => {
    logger.warn({
      msg: 'Auth rate limit exceeded',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again in 15 minutes.',
        retryAfter: 900
      },
      requestId: (req as any).id
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => isDevelopment() && req.path === '/api/v1/auth/register'
});

// Moderate rate limiter for data modification endpoints
export const moderateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit
});

// Lenient rate limiter for read-only endpoints
export const lenientRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit
});

logger.info({
  msg: 'Rate limiting configuration loaded',
  windowMs: RATE_LIMIT_WINDOW_MS,
  maxRequests: RATE_LIMIT_MAX,
  isDevelopment: isDevelopment()
});

export { generalRateLimit };
export default generalRateLimit;
