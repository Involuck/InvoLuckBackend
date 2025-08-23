/**
 * Health endpoint integration tests for InvoLuck Backend
 * Tests basic API health and system status endpoints
 */

import request from 'supertest';
import { app, testUtils, TEST_CONFIG } from './setup';

describe('Health Endpoints', () => {
  describe('GET /health', () => {
    it('should return 200 and basic health status', async () => {
      const response = await request(app).get('/health').expect(200);

      testUtils.assertApiResponse(response, 200);

      expect(response.body.data).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String),
        environment: expect.any(String),
        version: expect.any(String),
        uptime: expect.any(Number),
      });

      // Validate timestamp format
      expect(new Date(response.body.data.timestamp)).toBeInstanceOf(Date);

      // Validate uptime is positive
      expect(response.body.data.uptime).toBeGreaterThan(0);
    });

    it('should include requestId in response', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body.requestId).toBeDefined();
      expect(typeof response.body.requestId).toBe('string');
      expect(response.body.requestId.length).toBeGreaterThan(0);
    });

    it('should set proper response headers', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.headers['x-request-id']).toBeDefined();
    });
  });

  describe('GET /api/v1/health', () => {
    it('should return basic health information', async () => {
      const response = await request(app).get(`${TEST_CONFIG.baseURL}/health`).expect(200);

      testUtils.assertApiResponse(response, 200);

      expect(response.body.data).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String),
        environment: expect.any(String),
        version: expect.any(String),
        uptime: expect.any(Number),
      });
    });
  });

  describe('GET /api/v1/health/detailed', () => {
    it('should return detailed health status with service checks', async () => {
      const response = await request(app).get(`${TEST_CONFIG.baseURL}/health/detailed`).expect(200);

      testUtils.assertApiResponse(response, 200);

      expect(response.body.data).toMatchObject({
        status: expect.stringMatching(/^(ok|degraded)$/),
        timestamp: expect.any(String),
        responseTime: expect.stringMatching(/^\d+ms$/),
        environment: expect.any(String),
        version: expect.any(String),
        uptime: expect.any(Number),
        services: {
          database: {
            status: expect.stringMatching(/^(ok|error)$/),
            connectionState: expect.any(String),
          },
          email: {
            status: expect.stringMatching(/^(ok|error)$/),
          },
        },
        system: {
          memory: expect.objectContaining({
            rss: expect.any(Number),
            heapTotal: expect.any(Number),
            heapUsed: expect.any(Number),
            external: expect.any(Number),
          }),
          cpu: expect.objectContaining({
            user: expect.any(Number),
            system: expect.any(Number),
          }),
          nodeVersion: expect.any(String),
          platform: expect.any(String),
        },
      });
    });

    it('should have database status as ok in test environment', async () => {
      const response = await request(app).get(`${TEST_CONFIG.baseURL}/health/detailed`).expect(200);

      expect(response.body.data.services.database.status).toBe('ok');
      expect(response.body.data.services.database.connectionState).toBe('connected');
    });

    it('should measure response time', async () => {
      const response = await request(app).get(`${TEST_CONFIG.baseURL}/health/detailed`).expect(200);

      const responseTime = parseInt(response.body.data.responseTime.replace('ms', ''));
      expect(responseTime).toBeGreaterThan(0);
      expect(responseTime).toBeLessThan(5000); // Should be under 5 seconds
    });
  });

  describe('GET /api/v1/health/ping', () => {
    it('should return simple pong response', async () => {
      const response = await request(app).get(`${TEST_CONFIG.baseURL}/health/ping`).expect(200);

      testUtils.assertApiResponse(response, 200);

      expect(response.body.data).toMatchObject({
        message: 'pong',
        timestamp: expect.any(String),
      });
    });

    it('should respond quickly for ping endpoint', async () => {
      const startTime = Date.now();

      await request(app).get(`${TEST_CONFIG.baseURL}/health/ping`).expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond in under 1 second
    });
  });

  describe('API Root Endpoint', () => {
    it('should return API information at root', async () => {
      const response = await request(app).get('/').expect(200);

      testUtils.assertApiResponse(response, 200);

      expect(response.body.data).toMatchObject({
        message: 'InvoLuck Backend API',
        version: expect.any(String),
        documentation: '/api/v1/docs',
        health: '/health',
      });
    });

    it('should return API information at /api/v1', async () => {
      const response = await request(app).get(`${TEST_CONFIG.baseURL}`).expect(200);

      testUtils.assertApiResponse(response, 200);

      expect(response.body.data).toMatchObject({
        message: 'InvoLuck API v1',
        version: expect.any(String),
        endpoints: {
          auth: '/api/v1/auth',
          clients: '/api/v1/clients',
          invoices: '/api/v1/invoices',
          health: '/api/v1/health',
        },
        documentation: '/api/v1/docs',
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app).get('/non-existent-endpoint').expect(404);

      testUtils.assertNotFoundError(response);
      expect(response.body.error.message).toContain('not found');
    });

    it('should return 404 for non-existent API endpoints', async () => {
      const response = await request(app).get(`${TEST_CONFIG.baseURL}/non-existent`).expect(404);

      testUtils.assertNotFoundError(response);
    });

    it('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .post(`${TEST_CONFIG.baseURL}/health`)
        .send('invalid-json')
        .set('Content-Type', 'application/json')
        .expect(404); // POST not allowed on health endpoint

      testUtils.assertApiResponse(response, 404);
    });
  });

  describe('Request Headers', () => {
    it('should handle custom headers properly', async () => {
      const customHeaderValue = 'test-client-v1.0';

      const response = await request(app)
        .get(`${TEST_CONFIG.baseURL}/health/ping`)
        .set('User-Agent', customHeaderValue)
        .expect(200);

      testUtils.assertApiResponse(response, 200);

      // Request should still succeed with custom headers
      expect(response.body.success).toBe(true);
    });

    it('should include CORS headers for cross-origin requests', async () => {
      const response = await request(app)
        .get(`${TEST_CONFIG.baseURL}/health`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      // CORS headers should be present
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
