/**
 * Rate limiting configuration for InvoLuck Backend
 * Protects API endpoints from abuse and DoS attacks
 */

import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, isDevelopment } from './env';
import logger from './logger';

// Custom rate limit handler
const rateLimitHandler = (req: any, res: any): void => {
  logger.warn({
    msg: 'Rate limit exceeded',
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    path: req.path,
    method: req.method,
  });

  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
      retryAfter: Math.round(RATE_LIMIT_WINDOW_MS / 1000),
    },
    requestId: req.id,
  });
};

// Skip rate limiting function
const skipRateLimit = (req: any): boolean => {
  // Skip rate limiting in development for certain endpoints
  if (isDevelopment()) {
    const skipPaths = ['/api/v1/health', '/api/v1/docs'];
    return skipPaths.some(path => req.path.startsWith(path));
  }
  
  return false;
};

// General rate limiter configuration
export const generalRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  },
});

// Strict rate limiter for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: (req, res) => {
    logger.warn({
      msg: 'Auth rate limit exceeded',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again in 15 minutes.',
        retryAfter: 900, // 15 minutes
      },
      requestId: req.id,
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDevelopment() && req.path === '/api/v1/auth/register',
});

// Moderate rate limiter for data modification endpoints
export const moderateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
});

// Lenient rate limiter for read-only endpoints
export const lenientRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
});

// Log rate limiting configuration
logger.info({
  msg: 'Rate limiting configuration loaded',
  windowMs: RATE_LIMIT_WINDOW_MS,
  maxRequests: RATE_LIMIT_MAX,
  isDevelopment: isDevelopment(),
});

export default generalRateLimit;
