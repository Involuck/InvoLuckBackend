/**
 * Main routes index for InvoLuck Backend
 * Mounts all API routes with versioning
 */

import { Router } from 'express';

// Import route modules
import authRoutes from './auth.routes.js';
import clientsRoutes from './clients.routes.js';
import invoicesRoutes from './invoices.routes.js';
import healthRoutes from './health.routes.js';

// Create main router
const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/clients', clientsRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/health', healthRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'InvoLuck API v1',
      version: '1.0.0',
      endpoints: {
        auth: '/api/v1/auth',
        clients: '/api/v1/clients',
        invoices: '/api/v1/invoices',
        health: '/api/v1/health',
      },
      documentation: '/api/v1/docs',
    },
    requestId: req.id,
  });
});

export default router;
