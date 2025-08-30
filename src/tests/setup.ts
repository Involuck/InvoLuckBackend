import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import type { Express } from 'express';

// Global test variables
let mongoServer: MongoMemoryServer;
let appInstance: Express;

// App getter function that can be used as a module export
const getAppInstance = (): Express => {
  if (!appInstance) {
    throw new Error('App not initialized. Make sure tests run after beforeAll setup.');
  }
  return appInstance;
};

// Test configuration
export const TEST_CONFIG = {
  baseURL: '/api/v1',
  timeout: 30000,
  dbName: 'involuck-test'
};

export const TEST_USERS = {
  admin: {
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'Password123!',
    role: 'admin' as const
  },
  user: {
    name: 'Regular User',
    email: 'user@test.com',
    password: 'Password123!',
    role: 'user' as const
  },
  client: {
    name: 'Test Client',
    email: 'client@test.com',
    password: 'Password123!',
    role: 'user' as const
  }
};

export const TEST_CLIENT_DATA = {
  name: 'Test Client Company',
  email: 'testclient@example.com',
  company: 'Test Company Ltd',
  phone: '+1234567890',
  taxId: 'TAX123456789',
  currency: 'USD',
  paymentTerms: 30,
  status: 'active' as 'active' | 'inactive' | 'suspended',
  billingAddress: {
    street: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    postalCode: '12345',
    country: 'Test Country'
  }
};

export const TEST_INVOICE_DATA = {
  number: 'TEST-INV-001',
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  currency: 'USD',
  status: 'draft' as const,
  items: [
    {
      description: 'Test Service',
      quantity: 2,
      unitPrice: 100,
      taxRate: 10,
      discount: 0
    },
    {
      description: 'Another Test Service',
      quantity: 1,
      unitPrice: 150,
      taxRate: 10,
      discount: 5
    }
  ],
  taxRate: 10,
  discountType: 'percentage' as const,
  discountValue: 0,
  shippingCost: 25
};

describe('Test setup', () => {
  // Setup MongoDB Memory Server before all tests
  beforeAll(async () => {
    try {
      process.env.NODE_ENV = 'test';

      const appModule = await import('../app.js');
      appInstance = appModule.default;

      // Set up logger to be silent during tests
      try {
        const loggerModule = await import('../config/logger.js');
        const logger = loggerModule.default || loggerModule.logger;
        if (logger && typeof logger === 'object' && 'level' in logger) {
          logger.level = 'silent';
        }
      } catch (loggerError) {
        // Silently continue without logger in tests
        console.error('❌ Test setup failed:', loggerError);
      }

      // Start MongoDB Memory Server
      mongoServer = await MongoMemoryServer.create({
        instance: {
          dbName: TEST_CONFIG.dbName
        }
      });

      const mongoUri = mongoServer.getUri();

      // Disconnect any existing connections
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      // Connect to test database
      await mongoose.connect(mongoUri);

      console.log('✅ Test database connected');
    } catch (error) {
      console.error('❌ Test setup failed:', error);
      process.exit(1);
    }
  }, TEST_CONFIG.timeout);

  // Cleanup after all tests
  afterAll(async () => {
    try {
      // Close database connection
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }

      // Stop MongoDB Memory Server
      if (mongoServer) {
        await mongoServer.stop();
      }

      console.log('✅ Test cleanup completed');
    } catch (error) {
      console.error('❌ Test cleanup failed:', error);
    }
  }, TEST_CONFIG.timeout);

  // Clear database before each test
  beforeEach(async () => {
    try {
      // Get all collections
      const collections = mongoose.connection.collections;

      // Clear all collections
      const clearPromises = Object.values(collections).map(collection => collection.deleteMany({}));

      await Promise.all(clearPromises);
    } catch (error) {
      console.error('❌ Database cleanup failed:', error);
    }
  });
});

// Test utilities
export const testUtils = {
  async cleanupDatabase(): Promise<void> {
    try {
      const mongoose = (await import('mongoose')).default;

      if (mongoose.connection.readyState !== 1) {
        console.warn('⚠️ No active MongoDB connection to cleanup');
        return;
      }

      const collections = mongoose.connection.collections;
      await Promise.all(Object.values(collections).map(collection => collection.deleteMany({})));
    } catch (error: any) {
      console.error('❌ Database cleanup failed:', error.message);
    }
  },

  // Retry utility for flaky async operations
  async retryRequest<T>(fn: () => Promise<T>, retries = 3, delayMs = 300): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        if (attempt < retries) {
          await new Promise(res => setTimeout(res, delayMs));
        }
      }
    }

    throw lastError;
  },

  // Create a test user and return auth token
  async createAuthenticatedUser(userData = TEST_USERS.user): Promise<{
    user: any;
    token: string;
  }> {
    const { User } = await import('../models/User.js');
    const jwt = (await import('jsonwebtoken')).default;

    const user = new User(userData);
    await user.save();

    let JWT_SECRET: string;
    try {
      const envModule = await import('../config/env.js');
      JWT_SECRET = envModule.JWT_SECRET || process.env.JWT_SECRET || 'test-secret';
    } catch {
      JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    }

    const token = jwt.sign({ id: (user as any)._id.toString(), email: user.email }, JWT_SECRET, {
      expiresIn: '1h'
    });

    return { user, token };
  },

  // Create a test client for a user
  async createTestClient(userId: string, clientData = TEST_CLIENT_DATA): Promise<any> {
    const { Client } = await import('../models/Client.js');
    const client = new Client({ userId, ...clientData });
    await client.save();
    return client;
  },

  // Create a test invoice for a user and client
  async createTestInvoice(
    userId: string,
    clientId: string,
    invoiceData = TEST_INVOICE_DATA
  ): Promise<any> {
    const { Invoice } = await import('../models/Invoice.js');
    const invoice = new Invoice({ userId, clientId, ...invoiceData });
    await invoice.save();
    return invoice;
  },

  getAuthHeader(token: string): { Authorization: string } {
    return { Authorization: `Bearer ${token}` };
  },

  assertApiResponse(response: any, expectedStatus = 200): void {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('requestId');
    if (response.body.success) {
      expect(response.body).toHaveProperty('data');
    } else {
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
    }
  },

  assertPaginationResponse(response: any): void {
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toHaveProperty('page');
    expect(response.body.pagination).toHaveProperty('limit');
    expect(response.body.pagination).toHaveProperty('total');
    expect(response.body.pagination).toHaveProperty('totalPages');
    expect(response.body.pagination).toHaveProperty('hasNext');
    expect(response.body.pagination).toHaveProperty('hasPrev');
  },

  assertValidationError(response: any, fieldName?: string): void {
    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    if (fieldName) {
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: expect.stringContaining(fieldName)
          })
        ])
      );
    }
  },

  assertUnauthorizedError(response: any): void {
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  },

  assertNotFoundError(response: any): void {
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
  },

  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  randomString(length = 10): string {
    return Math.random()
      .toString(36)
      .substring(2, length + 2);
  },

  randomEmail(): string {
    return `test-${testUtils.randomString()}@example.com`;
  },

  randomNumber(min = 1, max = 1000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};

// Get app instance for testing
export const getApp = (): Express => {
  return getAppInstance();
};

// Export app getter as function for backward compatibility
export const app = getAppInstance;

export default {
  TEST_CONFIG,
  TEST_USERS,
  TEST_CLIENT_DATA,
  TEST_INVOICE_DATA,
  testUtils,
  getApp,
  app: getAppInstance
};
