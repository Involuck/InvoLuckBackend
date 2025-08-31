import { Router } from 'express';

// Import route modules
import { checkApiKey } from '../config/apiKey'; // ✅ nuevo

import authRoutes from './auth.routes.js';
import clientsRoutes from './clients.routes.js';
import healthRoutes from './health.routes.js';
import invoicesRoutes from './invoices.routes.js';

const router = Router();

// Mount routes
router.use('/auth', authRoutes, checkApiKey);
router.use('/clients', clientsRoutes, checkApiKey);
router.use('/invoices', invoicesRoutes, checkApiKey);
router.use('/health', healthRoutes);

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
        health: '/api/v1/health'
      },
      documentation: '/api/v1/docs'
    },
    requestId: req.id
  });
});

export default router;
