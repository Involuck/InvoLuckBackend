/**
 * CORS configuration for InvoLuck Backend
 * Configures Cross-Origin Resource Sharing with environment-based origins
 */

import cors from 'cors';
import { CORS_ORIGIN, isDevelopment } from './env';
import logger from './logger';

// Parse allowed origins from environment
const getAllowedOrigins = (): string[] => {
  const origins = CORS_ORIGIN.split(',').map(origin => origin.trim());

  // In development, allow all localhost origins
  if (isDevelopment()) {
    const developmentOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];

    return [...new Set([...origins, ...developmentOrigins])];
  }

  return origins;
};

const allowedOrigins = getAllowedOrigins();

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      logger.debug(`CORS: Allowing origin ${origin}`);
      return callback(null, true);
    }

    // In development, be more permissive
    if (isDevelopment()) {
      logger.debug(`CORS: Allowing development origin ${origin}`);
      return callback(null, true);
    }

    // Reject origin
    logger.warn(`CORS: Blocking origin ${origin}`);
    const error = new Error(`Origin ${origin} not allowed by CORS policy`);
    callback(error, false);
  },

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Request-ID',
  ],

  exposedHeaders: ['X-Request-ID', 'X-Total-Count', 'X-Page-Count'],

  credentials: true,

  // Preflight cache time (24 hours)
  maxAge: 86400,

  // Include successful OPTIONS requests in logs
  optionsSuccessStatus: 200,
};

// Create CORS middleware
export const corsMiddleware = cors(corsOptions);

// Log CORS configuration on startup
logger.info({
  msg: 'CORS configuration loaded',
  allowedOrigins: isDevelopment() ? 'All localhost origins + configured origins' : allowedOrigins,
  isDevelopment: isDevelopment(),
});

export { allowedOrigins };
export default corsMiddleware;
