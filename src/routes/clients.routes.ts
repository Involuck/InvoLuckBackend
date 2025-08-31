import { Router } from 'express';

import { moderateRateLimit, lenientRateLimit } from '../config/rateLimit.js';
import clientsController from '../controllers/clients.controller.js';
import { authMiddleware } from '../middlewares/auth.js';
import { validate, commonSchemas } from '../middlewares/validate.js';
import {
  createClientSchema,
  updateClientSchema,
  clientQuerySchema
} from '../validators/client.schema.js';

const router = Router();

router.use(authMiddleware);

/**
 * GET /api/v1/clients/search
 * Search clients by text (must be before /:id route)
 */
router.get('/search', lenientRateLimit, clientsController.searchClients);

/**
 * GET /api/v1/clients/stats
 * Get client statistics (must be before /:id route)
 */
router.get('/stats', lenientRateLimit, clientsController.getClientStats);

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
    body: updateClientSchema
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
