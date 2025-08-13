import express from 'express';
import dotenv from 'dotenv';

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

app.use(corsConfig);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(securityMiddleware);

app.get('/', (req, res) => {
  res.json({
    message: '🚀 InvoLuck API is running...',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    note: 'All routes are protected by security middleware'
  });
});

app.use('/api', routes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`🔒 All routes are protected by security middleware`);
});