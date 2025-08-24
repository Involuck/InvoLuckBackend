/**
 * Clients controller for InvoLuck Backend
 * Handles HTTP requests for client management
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, noContent } from '../utils/http.js';
import clientsService from '../services/clients.service.js';
import logger from '../config/logger.js';

class ClientsController {
  /**
   * POST /api/v1/clients
   * Create a new client
   */
  createClient = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const client = await clientsService.createClient(userId, req.body);

    logger.info({
      msg: 'Client created via API',
      clientId: (client as any)._id.toString(),
      userId,
      requestId: req.id,
    });

    return created(res, client);
  });

  /**
   * GET /api/v1/clients
   * Get clients with pagination and filtering
   */
  getClients = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await clientsService.getClients(userId, req.query as any);

    return ok(res, result.data, 200, result.pagination);
  });

  /**
   * GET /api/v1/clients/:id
   * Get client by ID
   */
  getClientById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const clientId = req.params.id;
    const client = await clientsService.getClientById(userId, clientId);

    return ok(res, client);
  });

  /**
   * PATCH /api/v1/clients/:id
   * Update client
   */
  updateClient = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const clientId = req.params.id;
    const client = await clientsService.updateClient(userId, clientId, req.body);

    logger.info({
      msg: 'Client updated via API',
      clientId: (client as any)._id.toString(),
      userId,
      updatedFields: Object.keys(req.body),
      requestId: req.id,
    });

    return ok(res, client);
  });

  /**
   * DELETE /api/v1/clients/:id
   * Delete client
   */
  deleteClient = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const clientId = req.params.id;
    await clientsService.deleteClient(userId, clientId);

    logger.info({
      msg: 'Client deleted via API',
      clientId,
      userId,
      requestId: req.id,
    });

    return noContent(res);
  });

  /**
   * GET /api/v1/clients/stats
   * Get client statistics
   */
  getClientStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const stats = await clientsService.getClientStats(userId);

    return ok(res, stats);
  });

  /**
   * GET /api/v1/clients/:id/stats
   * Get specific client statistics
   */
  getClientStatsByid = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const clientId = req.params.id;
    const stats = await clientsService.getClientStats(userId, clientId);

    return ok(res, stats);
  });

  /**
   * GET /api/v1/clients/search
   * Search clients by text
   */
  searchClients = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const searchTerm = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!searchTerm) {
      return ok(res, []);
    }

    const clients = await clientsService.searchClients(userId, searchTerm, limit);

    return ok(res, clients);
  });

  /**
   * POST /api/v1/clients/:id/update-financials
   * Update client financial data
   */
  updateClientFinancials = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const clientId = req.params.id;

    // Verify client belongs to user
    await clientsService.getClientById(userId, clientId);

    // Update financials
    await clientsService.updateClientFinancials(clientId);

    logger.info({
      msg: 'Client financials updated via API',
      clientId,
      userId,
      requestId: req.id,
    });

    return ok(res, { message: 'Client financials updated successfully' });
  });
}

export default new ClientsController();
