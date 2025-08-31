import path from 'path';
import { fileURLToPath } from 'url';

import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import corsMiddleware from './config/cors.js';
import { isDevelopment, SECURITY_HEADERS } from './config/env.js';
import { httpLoggerConfig } from './config/logger.js';
import { generalRateLimit } from './config/rateLimit.js';
import { errorHandler } from './middlewares/error.js';
import { notFoundHandler } from './middlewares/notFound.js';
import { requestIdMiddleware } from './middlewares/requestId.js';
import routes from './routes/index.js';

const app = express();

let currentFile: string;
let currentDir: string;

if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined) {
  try {
    currentFile = typeof __filename !== 'undefined' ? __filename : '/app';
    currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  } catch {
    currentFile = '/app';
    currentDir = process.cwd();
  }
} else {
  currentFile = fileURLToPath(import.meta.url);
  currentDir = path.dirname(currentFile);
}

app.use(express.static(path.join(currentDir, '../public')));
app.set('trust proxy', 1);

if (SECURITY_HEADERS) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'https://cdnjs.cloudflare.com']
        }
      },
      crossOriginEmbedderPolicy: false
    })
  );
}

app.use(requestIdMiddleware);
app.use(pinoHttp(httpLoggerConfig));
app.use(corsMiddleware);
app.use(generalRateLimit);

app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    }
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb'
  })
);

app.use(mongoSanitize());

if (isDevelopment()) {
  app.use((_req, res, next) => {
    res.header('X-Development-Mode', 'true');
    next();
  });
}

app.use('/api/v1', routes);

app.get('/', (req, res) => {
  const acceptHeader = req.headers.accept || '';
  if (acceptHeader.includes('text/html')) {
    res.sendFile(path.join(currentDir, '../public/index.html'));
    return;
  }
  res.json({
    success: true,
    data: {
      message: 'InvoLuck Backend API',
      version: '1.0.0',
      documentation: '/api/v1/docs',
      health: '/health'
    },
    requestId: req.id
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
