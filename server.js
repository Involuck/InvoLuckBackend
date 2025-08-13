import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';


import { validateEnvironment } from './config/environment.js';
import connectDB from './config/db.js';
import corsConfig from './config/cors.js';

import securityMiddleware from './middleware/security.js';
import errorHandler from './middleware/errorHandler.js';

import routes from './routes/index.js';

dotenv.config();
validateEnvironment();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(corsConfig);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  const acceptsHTML = req.headers.accept?.includes('text/html');
  if (acceptsHTML) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  return res.json({
    message: '🚀 InvoLuck API is running...',
    version: '1.0.0',
    note: 'API routes are protected by security middleware'
  });
});

app.get('/health-check', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api', securityMiddleware, routes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`📄 HTML available at: http://localhost:${PORT}`);
  console.log(`🔒 API routes (/api/*) are protected by security middleware`);
});