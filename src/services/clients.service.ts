/**
 * Clients service for InvoLuck Backend
 * Handles business logic for client management
 */

import { Types } from 'mongoose';
import { Client, IClient } from '../models/Client';
import { ApiErrors } from '../utils/ApiError';
import {
  parsePagination,
  createPaginatedResponse,
  createSortObject,
  CommonSortFields,
} from '../utils/pagination';
import logger from '../config/logger';
import {
  CreateClientInput,
  UpdateClientInput,
  ClientQueryInput,
} from '../validators/client.schema';

class ClientsService {
  /**
   * Create a new client
   */
  async createClient(userId: string, clientData: CreateClientInput): Promise<IClient> {
    try {
      // Check if client with same email already exists for this user
      const existingClient = await Client.findOne({
        userId: new Types.ObjectId(userId),
        email: clientData.email,
      });

      if (existingClient) {
        throw ApiErrors.conflict('Client with this email already exists');
      }

      const client = new Client({
        userId: new Types.ObjectId(userId),
        ...clientData,
      });

      await client.save();

      logger.info({
        msg: 'Client created successfully',
        clientId: (client._id as Types.ObjectId).toString(),
        userId,
        clientEmail: client.email,
      });

      return client;
    } catch (error) {
      logger.error({
        msg: 'Failed to create client',
        userId,
        clientEmail: clientData.email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get clients with pagination and filtering
   */
  async getClients(userId: string, query: ClientQueryInput) {
    try {
      const pagination = parsePagination({ query } as any);

      // Build filter
      const filter: any = { userId: new Types.ObjectId(userId) };

      if (query.search) {
        filter.$or = [
          { name: { $regex: query.search, $options: 'i' } },
          { email: { $regex: query.search, $options: 'i' } },
          { company: { $regex: query.search, $options: 'i' } },
        ];
      }

      if (query.status) {
        filter.status = query.status;
      }

      if (query.company) {
        filter.company = { $regex: query.company, $options: 'i' };
      }

      if (query.currency) {
        filter.currency = query.currency;
      }

      if (query.tags) {
        filter.tags = { $in: query.tags };
      }

      if (query.createdAfter || query.createdBefore) {
        filter.createdAt = {};
        if (query.createdAfter) {
          filter.createdAt.$gte = new Date(query.createdAfter);
        }
        if (query.createdBefore) {
          filter.createdAt.$lte = new Date(query.createdBefore);
        }
      }

      // Create sort object
      const sort = createSortObject({
        ...pagination,
        sort: query.sort || 'createdAt',
        order: query.order || 'desc',
      });

      // Execute queries
      const [clients, total] = await Promise.all([
        Client.find(filter).sort(sort).skip(pagination.skip).limit(pagination.limit).lean(),
        Client.countDocuments(filter),
      ]);

      return createPaginatedResponse(clients, total, pagination);
    } catch (error) {
      logger.error({
        msg: 'Failed to get clients',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get client by ID
   */
  async getClientById(userId: string, clientId: string): Promise<IClient> {
    try {
      const client = await Client.findOne({
        _id: new Types.ObjectId(clientId),
        userId: new Types.ObjectId(userId),
      });

      if (!client) {
        throw ApiErrors.notFound('Client', clientId);
      }

      return client;
    } catch (error) {
      logger.error({
        msg: 'Failed to get client by ID',
        userId,
        clientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update client
   */
  async updateClient(
    userId: string,
    clientId: string,
    updateData: UpdateClientInput
  ): Promise<IClient> {
    try {
      // Check if email is being changed and if it conflicts
      if (updateData.email) {
        const existingClient = await Client.findOne({
          userId: new Types.ObjectId(userId),
          email: updateData.email,
          _id: { $ne: new Types.ObjectId(clientId) },
        });

        if (existingClient) {
          throw ApiErrors.conflict('Another client with this email already exists');
        }
      }

      const client = await Client.findOneAndUpdate(
        {
          _id: new Types.ObjectId(clientId),
          userId: new Types.ObjectId(userId),
        },
        updateData,
        { new: true, runValidators: true }
      );

      if (!client) {
        throw ApiErrors.notFound('Client', clientId);
      }

      logger.info({
        msg: 'Client updated successfully',
        clientId: (client._id as Types.ObjectId).toString(),
        userId,
        updatedFields: Object.keys(updateData),
      });

      return client;
    } catch (error) {
      logger.error({
        msg: 'Failed to update client',
        userId,
        clientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Delete client
   */
  async deleteClient(userId: string, clientId: string): Promise<void> {
    try {
      // Check if client has invoices
      // TODO: Uncomment when Invoice model is properly imported
      // const invoiceCount = await Invoice.countDocuments({ clientId: new Types.ObjectId(clientId) });
      const invoiceCount = 0;

      if (invoiceCount > 0) {
        throw ApiErrors.badRequest(
          'Cannot delete client with existing invoices. Please delete all invoices first.'
        );
      }

      const client = await Client.findOneAndDelete({
        _id: new Types.ObjectId(clientId),
        userId: new Types.ObjectId(userId),
      });

      if (!client) {
        throw ApiErrors.notFound('Client', clientId);
      }

      logger.info({
        msg: 'Client deleted successfully',
        clientId: (client._id as Types.ObjectId).toString(),
        userId,
        clientEmail: client.email,
      });
    } catch (error) {
      logger.error({
        msg: 'Failed to delete client',
        userId,
        clientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get client statistics
   */
  async getClientStats(userId: string, clientId?: string) {
    try {
      const filter: any = { userId: new Types.ObjectId(userId) };
      if (clientId) {
        filter._id = new Types.ObjectId(clientId);
      }

      const stats = await Client.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalClients: { $sum: 1 },
            activeClients: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
            },
            totalInvoiced: { $sum: '$totalInvoiced' },
            totalPaid: { $sum: '$totalPaid' },
            outstandingBalance: { $sum: '$outstandingBalance' },
            averageInvoiceValue: { $avg: '$totalInvoiced' },
          },
        },
      ]);

      const result = stats[0] || {
        totalClients: 0,
        activeClients: 0,
        totalInvoiced: 0,
        totalPaid: 0,
        outstandingBalance: 0,
        averageInvoiceValue: 0,
      };

      return result;
    } catch (error) {
      logger.error({
        msg: 'Failed to get client statistics',
        userId,
        clientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Search clients by text
   */
  async searchClients(userId: string, searchTerm: string, limit = 10) {
    try {
      const clients = await Client.find({
        userId: new Types.ObjectId(userId),
        $text: { $search: searchTerm },
      })
        .select('name email company status')
        .limit(limit)
        .lean();

      return clients;
    } catch (error) {
      logger.error({
        msg: 'Failed to search clients',
        userId,
        searchTerm,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update client financial data
   */
  async updateClientFinancials(clientId: string): Promise<void> {
    try {
      const client = await Client.findById(clientId);
      if (client) {
        await client.updateFinancials();
      }
    } catch (error) {
      logger.error({
        msg: 'Failed to update client financials',
        clientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

export const clientsService = new ClientsService();
export default clientsService;
