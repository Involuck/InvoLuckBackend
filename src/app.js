import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from './config/environment.js';
import corsConfig from './config/cors.js';
import { setupDatabase } from './config/database.js';
import { setupHealthRoutes } from './routes/health.js';
import { setupDevelopmentRoutes } from './routes/development.js';

import securityMiddleware from './middleware/security.js';
import errorHandler from './middleware/errorHandler.js';
import rateLimiter from './middleware/rateLimiter.js';

import routes from './routes/api.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(corsConfig);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

setupDatabase();

// log requests in development
if (config.nodeEnv !== 'production') {
  const { default: morgan } = await import('morgan');
  app.use(morgan('dev'));
}

app.get('/', (req, res) => {
  const acceptHeader = req.headers.accept || '';

  if (acceptHeader.includes('text/html') && !acceptHeader.includes('application/json')) {
    return res.sendFile(path.join(__dirname, '../public', 'index.html'));
  }

  return res.json({
    message: '🚀 InvoLuck API is running...',
    version: '1.0.0',
    status: 'active',
    note: 'API routes are protected by security middleware',
  });
});

setupHealthRoutes(app, securityMiddleware);

// development routes
if (config.nodeEnv !== 'production') {
  setupDevelopmentRoutes(app);
}

app.use('/api', rateLimiter(), securityMiddleware, routes);

// not found handler
app.use((req, res) => {
  const isApiRoute = req.originalUrl.startsWith('/api');
  const acceptsHTML = req.headers.accept?.includes('text/html');

  if (isApiRoute || !acceptsHTML) {
    return res.status(404).json({
      success: false,
      error: isApiRoute ? 'API Endpoint Not Found' : 'Resource Not Found',
      message: `The route ${req.method} ${req.originalUrl} does not exist`,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }

  return res.status(404).sendFile(path.join(__dirname, '../public', '404.html'));
});

app.use(errorHandler);

export default app;
