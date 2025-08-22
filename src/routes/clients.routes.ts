/**
 * Client routes for InvoLuck Backend
 * Handles client management endpoints
 */

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { moderateRateLimit, lenientRateLimit } from '../config/rateLimit';
import { validate } from '../middlewares/validate';
import {
  createClientSchema,
  updateClientSchema,
  clientParamsSchema,
  clientQuerySchema,
} from '../validators/client.schema';
import { commonSchemas } from '../middlewares/validate';
import clientsController from '../controllers/clients.controller';

const router = Router();

// All client routes require authentication
router.use(authMiddleware);

/**
 * GET /api/v1/clients/search
 * Search clients by text (must be before /:id route)
 */
router.get(
  '/search',
  lenientRateLimit,
  clientsController.searchClients
);

/**
 * GET /api/v1/clients/stats
 * Get client statistics (must be before /:id route)
 */
router.get(
  '/stats',
  lenientRateLimit,
  clientsController.getClientStats
);

/**
 * POST /api/v1/clients
 * Create a new client
 */
router.post(
  '/',
  moderateRateLimit,
  validate({ body: createClientSchema }),
  clientsController.createClient
);

/**
 * GET /api/v1/clients
 * Get clients with pagination and filtering
 */
router.get(
  '/',
  lenientRateLimit,
  validate({ query: clientQuerySchema }),
  clientsController.getClients
);

/**
 * GET /api/v1/clients/:id
 * Get client by ID
 */
router.get(
  '/:id',
  lenientRateLimit,
  validate({ params: commonSchemas.objectIdParam }),
  clientsController.getClientById
);

/**
 * PATCH /api/v1/clients/:id
 * Update client
 */
router.patch(
  '/:id',
  moderateRateLimit,
  validate({
    params: commonSchemas.objectIdParam,
    body: updateClientSchema,
  }),
  clientsController.updateClient
);

/**
 * DELETE /api/v1/clients/:id
 * Delete client
 */
router.delete(
  '/:id',
  moderateRateLimit,
  validate({ params: commonSchemas.objectIdParam }),
  clientsController.deleteClient
);

/**
 * GET /api/v1/clients/:id/stats
 * Get specific client statistics
 */
router.get(
  '/:id/stats',
  lenientRateLimit,
  validate({ params: commonSchemas.objectIdParam }),
  clientsController.getClientStatsByid
);

/**
 * POST /api/v1/clients/:id/update-financials
 * Update client financial data
 */
router.post(
  '/:id/update-financials',
  moderateRateLimit,
  validate({ params: commonSchemas.objectIdParam }),
  clientsController.updateClientFinancials
);

export default router;
