/**
 * Express application setup for InvoLuck Backend
 * Configures middleware, routes, and error handling
 */

import express from 'express';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import pinoHttp from 'pino-http';
import path from 'path';
import { fileURLToPath } from 'url';

// Import configuration
import { isDevelopment, SECURITY_HEADERS } from './config/env';
import { corsMiddleware } from './config/cors';
import { generalRateLimit } from './config/rateLimit';
import { httpLoggerConfig } from './config/logger';

// Import middleware
import { requestIdMiddleware } from './middlewares/requestId';
import { errorHandler } from './middlewares/error';
import { notFoundHandler } from './middlewares/notFound';

// Import routes
import routes from './routes';

// Create Express application
const app = express();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Trust proxy (for reverse proxies like nginx, AWS ALB, etc.)
app.set('trust proxy', 1);

// Security middleware
if (SECURITY_HEADERS) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );
}

// Request ID middleware (before logging)
app.use(requestIdMiddleware);

// HTTP request logging
app.use(pinoHttp(httpLoggerConfig));

// CORS configuration
app.use(corsMiddleware);

// Rate limiting
app.use(generalRateLimit);

// Body parsing middleware
app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      // Store raw body for webhook verification if needed
      (req as any).rawBody = buf;
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

// Data sanitization
app.use(mongoSanitize());

// Development middleware
if (isDevelopment()) {
  // Additional development middleware can go here
  app.use((_req, res, next) => {
    res.header('X-Development-Mode', 'true');
    next();
  });
}

// API routes
app.use('/api/v1', routes);

// Health check endpoint (before catch-all)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    },
    requestId: req.id,
  });
});

// Basic root endpoint
app.get('/', (req, res) => {
  const acceptHeader = req.headers.accept || '';

  // Si el cliente acepta HTML y no está solicitando específicamente JSON
  if (acceptHeader.includes('text/html') && !acceptHeader.includes('application/json')) {
    return res.sendFile(path.join(__dirname, '../public/index.html'));
  }

  // Para solicitudes de API, devolver JSON
  res.json({
    success: true,
    data: {
      message: 'InvoLuck Backend API',
      version: '1.0.0',
      documentation: '/api/v1/docs',
      health: '/health',
    },
    requestId: req.id,
  });
});

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
