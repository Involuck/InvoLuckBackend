import cors from 'cors';

import { CORS_ORIGIN, isDevelopment } from './env.js';
import logger from './logger.js';

const getAllowedOrigins = (): string[] => {
  if (!CORS_ORIGIN) return [];

  const origins = CORS_ORIGIN.split(',')
    .map(o => o.trim())
    .filter(Boolean);

  if (isDevelopment()) {
    const localOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];
    return [...new Set([...origins, ...localOrigins])];
  }

  return origins;
};

const allowedOrigins = getAllowedOrigins();

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      if (isDevelopment()) logger.debug({ msg: 'CORS allowed', origin });
      callback(null, true);
      return;
    }

    if (isDevelopment()) {
      logger.debug({ msg: 'CORS allowed (dev override)', origin });
      callback(null, true);
      return;
    }

    logger.warn({ msg: 'CORS blocked', origin });
    callback(new Error(`Origin ${origin} not allowed by CORS policy`), false);
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
    'X-API-Key'
  ],

  exposedHeaders: ['X-Request-ID', 'X-Total-Count', 'X-Page-Count'],

  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 200
};

const corsMiddleware = cors(corsOptions);

logger.info({
  msg: 'CORS configuration loaded',
  allowedOrigins: isDevelopment() ? 'All localhost + configured origins' : allowedOrigins,
  isDevelopment: isDevelopment()
});

export { allowedOrigins, corsMiddleware };
export default corsMiddleware;
