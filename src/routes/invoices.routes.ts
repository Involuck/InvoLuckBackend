/**
 * Invoice routes for InvoLuck Backend
 * Handles invoice management endpoints
 */

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { moderateRateLimit, lenientRateLimit } from '../config/rateLimit';
import { validate } from '../middlewares/validate';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  updateInvoiceStatusSchema,
  invoiceParamsSchema,
  invoiceQuerySchema,
  sendInvoiceSchema,
} from '../validators/invoice.schema';
import { commonSchemas } from '../middlewares/validate';
import invoicesController from '../controllers/invoices.controller';

const router = Router();

// All invoice routes require authentication
router.use(authMiddleware);

/**
 * GET /api/v1/invoices/stats
 * Get invoice statistics (must be before /:id route)
 */
router.get('/stats', lenientRateLimit, invoicesController.getInvoiceStats);

/**
 * GET /api/v1/invoices/overdue
 * Get overdue invoices (must be before /:id route)
 */
router.get('/overdue', lenientRateLimit, invoicesController.getOverdueInvoices);

/**
 * POST /api/v1/invoices
 * Create a new invoice
 */
router.post(
  '/',
  moderateRateLimit,
  validate({ body: createInvoiceSchema }),
  invoicesController.createInvoice
);

/**
 * GET /api/v1/invoices
 * Get invoices with pagination and filtering
 */
router.get(
  '/',
  lenientRateLimit,
  validate({ query: invoiceQuerySchema }),
  invoicesController.getInvoices
);

/**
 * GET /api/v1/invoices/:id
 * Get invoice by ID
 */
router.get(
  '/:id',
  lenientRateLimit,
  validate({ params: commonSchemas.objectIdParam }),
  invoicesController.getInvoiceById
);

/**
 * PATCH /api/v1/invoices/:id
 * Update invoice
 */
router.patch(
  '/:id',
  moderateRateLimit,
  validate({
    params: commonSchemas.objectIdParam,
    body: updateInvoiceSchema,
  }),
  invoicesController.updateInvoice
);

/**
 * DELETE /api/v1/invoices/:id
 * Delete invoice
 */
router.delete(
  '/:id',
  moderateRateLimit,
  validate({ params: commonSchemas.objectIdParam }),
  invoicesController.deleteInvoice
);

/**
 * POST /api/v1/invoices/:id/send
 * Send invoice via email
 */
router.post(
  '/:id/send',
  moderateRateLimit,
  validate({
    params: commonSchemas.objectIdParam,
    body: sendInvoiceSchema,
  }),
  invoicesController.sendInvoice
);

/**
 * PATCH /api/v1/invoices/:id/status
 * Update invoice status
 */
router.patch(
  '/:id/status',
  moderateRateLimit,
  validate({
    params: commonSchemas.objectIdParam,
    body: updateInvoiceStatusSchema,
  }),
  invoicesController.updateInvoiceStatus
);

/**
 * POST /api/v1/invoices/:id/mark-viewed
 * Mark invoice as viewed
 */
router.post(
  '/:id/mark-viewed',
  lenientRateLimit,
  validate({ params: commonSchemas.objectIdParam }),
  invoicesController.markInvoiceAsViewed
);

/**
 * POST /api/v1/invoices/:id/duplicate
 * Duplicate an invoice
 */
router.post(
  '/:id/duplicate',
  moderateRateLimit,
  validate({ params: commonSchemas.objectIdParam }),
  invoicesController.duplicateInvoice
);

export default router;
