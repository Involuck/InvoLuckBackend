/**
 * Clients integration tests for InvoLuck Backend
 * Tests client management CRUD operations
 */

import request from 'supertest';
import { app, testUtils, TEST_CONFIG, TEST_CLIENT_DATA } from './setup';

describe('Clients Endpoints', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const { user, token } = await testUtils.createAuthenticatedUser();
    authToken = token;
    userId = (user as any)._id.toString()();
  });

  describe('POST /api/v1/clients', () => {
    it('should create a new client successfully', async () => {
      const clientData = {
        ...TEST_CLIENT_DATA,
        email: testUtils.randomEmail(),
      };

      const response = await request(app)
        .post(`${TEST_CONFIG.baseURL}/clients`)
        .set(testUtils.getAuthHeader(authToken))
        .send(clientData)
        .expect(201);

      testUtils.assertApiResponse(response, 201);

      expect(response.body.data).toMatchObject({
        _id: expect.any(String),
        userId,
        name: clientData.name,
        email: clientData.email,
        company: clientData.company,
        phone: clientData.phone,
        taxId: clientData.taxId,
        currency: clientData.currency,
        paymentTerms: clientData.paymentTerms,
        status: clientData.status,
        billingAddress: clientData.billingAddress,
        totalInvoiced: 0,
        totalPaid: 0,
        outstandingBalance: 0,
        invoiceCount: 0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return validation error for missing required fields', async () => {
      const incompleteData = {
        name: 'Test Client',
        // Missing email
      };

      const response = await request(app)
        .post(`${TEST_CONFIG.baseURL}/clients`)
        .set(testUtils.getAuthHeader(authToken))
        .send(incompleteData)
        .expect(422);

      testUtils.assertValidationError(response, 'email');
    });

    it('should return validation error for invalid email', async () => {
      const clientData = {
        ...TEST_CLIENT_DATA,
        email: 'invalid-email',
      };

      const response = await request(app)
        .post(`${TEST_CONFIG.baseURL}/clients`)
        .set(testUtils.getAuthHeader(authToken))
        .send(clientData)
        .expect(422);

      testUtils.assertValidationError(response, 'email');
    });

    it('should return conflict error for duplicate email within user scope', async () => {
      const clientData = {
        ...TEST_CLIENT_DATA,
        email: 'duplicate@example.com',
      };

      // Create first client
      await request(app)
        .post(`${TEST_CONFIG.baseURL}/clients`)
        .set(testUtils.getAuthHeader(authToken))
        .send(clientData)
        .expect(201);

      // Try to create client with same email
      const response = await request(app)
        .post(`${TEST_CONFIG.baseURL}/clients`)
        .set(testUtils.getAuthHeader(authToken))
        .send(clientData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`${TEST_CONFIG.baseURL}/clients`)
        .send(TEST_CLIENT_DATA)
        .expect(401);

      testUtils.assertUnauthorizedError(response);
    });
  });

  describe('GET /api/v1/clients', () => {
    beforeEach(async () => {
      // Create some test clients
      await testUtils.createTestClient(userId, {
        ...TEST_CLIENT_DATA,
        name: 'Client A',
        email: 'clienta@example.com',
      });

      await testUtils.createTestClient(userId, {
        ...TEST_CLIENT_DATA,
        name: 'Client B',
        email: 'clientb@example.com',
        status: 'inactive',
      });
    });

    it('should return paginated list of clients', async () => {
      const response = await request(app)
        .get(`${TEST_CONFIG.baseURL}/clients`)
        .set(testUtils.getAuthHeader(authToken))
        .expect(200);

      testUtils.assertApiResponse(response, 200);
      testUtils.assertPaginationResponse(response);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter clients by status', async () => {
      const response = await request(app)
        .get(`${TEST_CONFIG.baseURL}/clients?status=active`)
        .set(testUtils.getAuthHeader(authToken))
        .expect(200);

      testUtils.assertApiResponse(response, 200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe('active');
    });

    it('should search clients by name', async () => {
      const response = await request(app)
        .get(`${TEST_CONFIG.baseURL}/clients?search=Client A`)
        .set(testUtils.getAuthHeader(authToken))
        .expect(200);

      testUtils.assertApiResponse(response, 200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Client A');
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get(`${TEST_CONFIG.baseURL}/clients?page=1&limit=1`)
        .set(testUtils.getAuthHeader(authToken))
        .expect(200);

      testUtils.assertApiResponse(response, 200);
      testUtils.assertPaginationResponse(response);

      expect(response.body.data.length).toBe(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.hasNext).toBe(true);
    });

    it('should only return clients for authenticated user', async () => {
      // Create another user with clients
      const { token: otherToken } = await testUtils.createAuthenticatedUser({
        name: 'Other User',
        email: 'other@example.com',
        password: 'Password123!',
        role: 'user',
      });

      const otherUserId = 'other-user-id'; // This would be the real user ID

      // Request should only return current user's clients
      const response = await request(app)
        .get(`${TEST_CONFIG.baseURL}/clients`)
        .set(testUtils.getAuthHeader(authToken))
        .expect(200);

      // Should only see the 2 clients we created for this user
      expect(response.body.data.length).toBe(2);
      response.body.data.forEach((client: any) => {
        expect(client.userId).toBe(userId);
      });
    });

    it('should require authentication', async () => {
      const response = await request(app).get(`${TEST_CONFIG.baseURL}/clients`).expect(401);

      testUtils.assertUnauthorizedError(response);
    });
  });

  describe('GET /api/v1/clients/:id', () => {
    let clientId: string;

    beforeEach(async () => {
      const client = await testUtils.createTestClient(userId);
      clientId = (client._id as Types.ObjectId).toString();
    });

    it('should return client by ID', async () => {
      const response = await request(app)
        .get(`${TEST_CONFIG.baseURL}/clients/${clientId}`)
        .set(testUtils.getAuthHeader(authToken))
        .expect(200);

      testUtils.assertApiResponse(response, 200);

      expect(response.body.data).toMatchObject({
        _id: clientId,
        userId,
        name: TEST_CLIENT_DATA.name,
        email: TEST_CLIENT_DATA.email,
      });
    });

    it('should return 404 for non-existent client', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`${TEST_CONFIG.baseURL}/clients/${fakeId}`)
        .set(testUtils.getAuthHeader(authToken))
        .expect(404);

      testUtils.assertNotFoundError(response);
    });

    it('should return validation error for invalid ID format', async () => {
      const response = await request(app)
        .get(`${TEST_CONFIG.baseURL}/clients/invalid-id`)
        .set(testUtils.getAuthHeader(authToken))
        .expect(422);

      testUtils.assertValidationError(response, 'id');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`${TEST_CONFIG.baseURL}/clients/${clientId}`)
        .expect(401);

      testUtils.assertUnauthorizedError(response);
    });
  });

  describe('PATCH /api/v1/clients/:id', () => {
    let clientId: string;

    beforeEach(async () => {
      const client = await testUtils.createTestClient(userId);
      clientId = (client._id as Types.ObjectId).toString();
    });

    it('should update client successfully', async () => {
      const updateData = {
        name: 'Updated Client Name',
        phone: '+9876543210',
      };

      const response = await request(app)
        .patch(`${TEST_CONFIG.baseURL}/clients/${clientId}`)
        .set(testUtils.getAuthHeader(authToken))
        .send(updateData)
        .expect(200);

      testUtils.assertApiResponse(response, 200);

      expect(response.body.data).toMatchObject({
        _id: clientId,
        name: updateData.name,
        phone: updateData.phone,
        email: TEST_CLIENT_DATA.email, // Should remain unchanged
      });
    });

    it('should return 404 for non-existent client', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = { name: 'Updated Name' };

      const response = await request(app)
        .patch(`${TEST_CONFIG.baseURL}/clients/${fakeId}`)
        .set(testUtils.getAuthHeader(authToken))
        .send(updateData)
        .expect(404);

      testUtils.assertNotFoundError(response);
    });

    it('should return validation error for empty update', async () => {
      const response = await request(app)
        .patch(`${TEST_CONFIG.baseURL}/clients/${clientId}`)
        .set(testUtils.getAuthHeader(authToken))
        .send({})
        .expect(422);

      testUtils.assertValidationError(response);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .patch(`${TEST_CONFIG.baseURL}/clients/${clientId}`)
        .send({ name: 'Updated Name' })
        .expect(401);

      testUtils.assertUnauthorizedError(response);
    });
  });

  describe('DELETE /api/v1/clients/:id', () => {
    let clientId: string;

    beforeEach(async () => {
      const client = await testUtils.createTestClient(userId);
      clientId = (client._id as Types.ObjectId).toString();
    });

    it('should delete client successfully', async () => {
      const response = await request(app)
        .delete(`${TEST_CONFIG.baseURL}/clients/${clientId}`)
        .set(testUtils.getAuthHeader(authToken))
        .expect(204);

      expect(response.body).toEqual({});
    });

    it('should return 404 for non-existent client', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`${TEST_CONFIG.baseURL}/clients/${fakeId}`)
        .set(testUtils.getAuthHeader(authToken))
        .expect(404);

      testUtils.assertNotFoundError(response);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`${TEST_CONFIG.baseURL}/clients/${clientId}`)
        .expect(401);

      testUtils.assertUnauthorizedError(response);
    });
  });

  describe('GET /api/v1/clients/search', () => {
    beforeEach(async () => {
      await testUtils.createTestClient(userId, {
        ...TEST_CLIENT_DATA,
        name: 'Searchable Client',
        email: 'searchable@example.com',
      });
    });

    it('should search clients by query', async () => {
      const response = await request(app)
        .get(`${TEST_CONFIG.baseURL}/clients/search?q=Searchable`)
        .set(testUtils.getAuthHeader(authToken))
        .expect(200);

      testUtils.assertApiResponse(response, 200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', async () => {
      const response = await request(app)
        .get(`${TEST_CONFIG.baseURL}/clients/search?q=NonExistentClient`)
        .set(testUtils.getAuthHeader(authToken))
        .expect(200);

      testUtils.assertApiResponse(response, 200);
      expect(response.body.data).toEqual([]);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`${TEST_CONFIG.baseURL}/clients/search?q=test`)
        .expect(401);

      testUtils.assertUnauthorizedError(response);
    });
  });

  describe('GET /api/v1/clients/stats', () => {
    beforeEach(async () => {
      await testUtils.createTestClient(userId);
    });

    it('should return client statistics', async () => {
      const response = await request(app)
        .get(`${TEST_CONFIG.baseURL}/clients/stats`)
        .set(testUtils.getAuthHeader(authToken))
        .expect(200);

      testUtils.assertApiResponse(response, 200);

      expect(response.body.data).toMatchObject({
        totalClients: expect.any(Number),
        activeClients: expect.any(Number),
        totalInvoiced: expect.any(Number),
        totalPaid: expect.any(Number),
        outstandingBalance: expect.any(Number),
        averageInvoiceValue: expect.any(Number),
      });

      expect(response.body.data.totalClients).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      const response = await request(app).get(`${TEST_CONFIG.baseURL}/clients/stats`).expect(401);

      testUtils.assertUnauthorizedError(response);
    });
  });
});
