import logger from '../config/logger.js';
import clientsService from '../services/clients.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, noContent } from '../utils/http.js';

import type { Request, Response } from 'express';

class ClientsController {
  createClient = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const client = await clientsService.createClient(userId, req.body);

    logger.info({
      msg: 'Client created via API',
      clientId: (client as any)._id.toString(),
      userId,
      requestId: req.id
    });

    return created(res, client);
  });

  getClients = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await clientsService.getClients(userId, req.query as any);

    return ok(res, result.data, 200, result.pagination);
  });

  getClientById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const clientId = req.params.id;
    const client = await clientsService.getClientById(userId, clientId);

    return ok(res, client);
  });

  updateClient = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const clientId = req.params.id;
    const client = await clientsService.updateClient(userId, clientId, req.body);

    logger.info({
      msg: 'Client updated via API',
      clientId: (client as any)._id.toString(),
      userId,
      updatedFields: Object.keys(req.body),
      requestId: req.id
    });

    return ok(res, client);
  });

  deleteClient = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const clientId = req.params.id;
    await clientsService.deleteClient(userId, clientId);

    logger.info({
      msg: 'Client deleted via API',
      clientId,
      userId,
      requestId: req.id
    });

    return noContent(res);
  });

  getClientStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const stats = await clientsService.getClientStats(userId);

    return ok(res, stats);
  });

  getClientStatsByid = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const clientId = req.params.id;
    const stats = await clientsService.getClientStats(userId, clientId);

    return ok(res, stats);
  });

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
      requestId: req.id
    });

    return ok(res, { message: 'Client financials updated successfully' });
  });
}

export default new ClientsController();
