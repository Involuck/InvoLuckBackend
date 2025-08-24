/**
 * Jest test setup for InvoLuck Backend
 * Global test configuration and utilities
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../app.js';
import logger from '../config/logger.js';

// Global test variables
let mongoServer: MongoMemoryServer;

// Test configuration
export const TEST_CONFIG = {
  baseURL: '/api/v1',
  timeout: 30000,
  dbName: 'involuck-test',
};

// Test user data
export const TEST_USERS = {
  admin: {
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'Password123!',
    role: 'admin' as const,
  },
  user: {
    name: 'Regular User',
    email: 'user@test.com',
    password: 'Password123!',
    role: 'user' as const,
  },
  client: {
    name: 'Test Client',
    email: 'client@test.com',
    password: 'Password123!',
    role: 'user' as const,
  },
};

// Test client data
export const TEST_CLIENT_DATA = {
  name: 'Test Client Company',
  email: 'testclient@example.com',
  company: 'Test Company Ltd',
  phone: '+1234567890',
  taxId: 'TAX123456789',
  currency: 'USD',
  paymentTerms: 30,
  status: 'active' as const,
  billingAddress: {
    street: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    postalCode: '12345',
    country: 'Test Country',
  },
};

// Test invoice data
export const TEST_INVOICE_DATA = {
  number: 'TEST-INV-001',
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  currency: 'USD',
  status: 'draft' as const,
  items: [
    {
      description: 'Test Service',
      quantity: 2,
      unitPrice: 100,
      taxRate: 10,
      discount: 0,
    },
    {
      description: 'Another Test Service',
      quantity: 1,
      unitPrice: 150,
      taxRate: 10,
      discount: 5,
    },
  ],
  taxRate: 10,
  discountType: 'percentage' as const,
  discountValue: 0,
  shippingCost: 25,
};

/**
 * Setup MongoDB Memory Server before all tests
 */
beforeAll(async () => {
  try {
    // Silence logs during tests
    logger.level = 'silent';

    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: TEST_CONFIG.dbName,
      },
    });

    const mongoUri = mongoServer.getUri();

    // Connect to test database
    await mongoose.connect(mongoUri);

    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    process.exit(1);
  }
}, TEST_CONFIG.timeout);

/**
 * Cleanup after all tests
 */
afterAll(async () => {
  try {
    // Close database connection
    await mongoose.connection.close();

    // Stop MongoDB Memory Server
    if (mongoServer) {
      await mongoServer.stop();
    }

    console.log('✅ Test cleanup completed');
  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
  }
}, TEST_CONFIG.timeout);

/**
 * Clear database before each test
 */
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

/**
 * Test utilities
 */
export const testUtils = {
  /**
   * Create a test user and return auth token
   */
  async createAuthenticatedUser(userData = TEST_USERS.user): Promise<{
    user: any;
    token: string;
  }> {
    const { User } = await import('../models/User.js');

    const user = new User(userData);
    await user.save();

    // Generate token manually (since we don't want to test auth here)
    const jwt = await import('jsonwebtoken');
    const { JWT_SECRET } = await import('../config/env.js');

    const token = jwt.sign({ id: (user as any)._id.toString(), email: user.email }, JWT_SECRET, {
      expiresIn: '1h',
    });

    return { user, token };
  },

  /**
   * Create a test client for a user
   */
  async createTestClient(userId: string, clientData = TEST_CLIENT_DATA): Promise<any> {
    const { Client } = await import('../models/Client.js');

    const client = new Client({
      userId,
      ...clientData,
    });

    await client.save();
    return client;
  },

  /**
   * Create a test invoice for a user and client
   */
  async createTestInvoice(
    userId: string,
    clientId: string,
    invoiceData = TEST_INVOICE_DATA
  ): Promise<any> {
    const { Invoice } = await import('../models/Invoice.js');

    const invoice = new Invoice({
      userId,
      clientId,
      ...invoiceData,
    });

    await invoice.save();
    return invoice;
  },

  /**
   * Get authorization header for tests
   */
  getAuthHeader(token: string): { Authorization: string } {
    return { Authorization: `Bearer ${token}` };
  },

  /**
   * Assert standard API response format
   */
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

  /**
   * Assert pagination response format
   */
  assertPaginationResponse(response: any): void {
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toHaveProperty('page');
    expect(response.body.pagination).toHaveProperty('limit');
    expect(response.body.pagination).toHaveProperty('total');
    expect(response.body.pagination).toHaveProperty('totalPages');
    expect(response.body.pagination).toHaveProperty('hasNext');
    expect(response.body.pagination).toHaveProperty('hasPrev');
  },

  /**
   * Assert validation error response
   */
  assertValidationError(response: any, fieldName?: string): void {
    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');

    if (fieldName) {
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: expect.stringContaining(fieldName),
          }),
        ])
      );
    }
  },

  /**
   * Assert unauthorized error response
   */
  assertUnauthorizedError(response: any): void {
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  },

  /**
   * Assert not found error response
   */
  assertNotFoundError(response: any): void {
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
  },

  /**
   * Sleep utility for testing async operations
   */
  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Generate random test data
   */
  randomString(length = 10): string {
    return Math.random()
      .toString(36)
      .substring(2, length + 2);
  },

  randomEmail(): string {
    return `test-${this.randomString()}@example.com`;
  },

  randomNumber(min = 1, max = 1000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
};

// Export app instance for testing
export { app };

// Default export
export default {
  TEST_CONFIG,
  TEST_USERS,
  TEST_CLIENT_DATA,
  TEST_INVOICE_DATA,
  testUtils,
  app,
};
