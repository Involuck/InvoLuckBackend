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

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(corsConfig);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    return res.status(500).json({
      error: "Internal Server Error",
      code: "DB_CONNECTION_FAILED"
    });
  }
})

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

app.get('/health-check', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbError = null;

  try {
    const conn = await connectDB();
    dbStatus = conn.connection.readyState === 1 ? 'connected' : 'not-ready';
  } catch (err) {
    dbError = err.message;
  }

  res.json({
    status: 'OK',
    api: 'running',
    db: {
      status: dbStatus,
      error: dbError
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});


app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    return res.status(500).json({
      error: "Internal Server Error",
      code: "DB_CONNECTION_FAILED"
    });
  }
}, securityMiddleware, routes);


app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});