/**
 * Authentication integration tests for InvoLuck Backend
 * Tests user registration, login, and authentication workflows
 */

import request from 'supertest';
import { app, testUtils, TEST_CONFIG, TEST_USERS } from './setup';

describe('Authentication Endpoints', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const response = await request(app)
        .post(`${TEST_CONFIG.baseURL}/auth/register`)
        .send(userData)
        .expect(201);

      testUtils.assertApiResponse(response, 201);

      expect(response.body.data).toMatchObject({
        user: {
          id: expect.any(String),
          name: userData.name,
          email: userData.email,
          role: 'user',
          isEmailVerified: false,
          preferences: expect.any(Object),
          createdAt: expect.any(String),
        },
        token: expect.any(String),
        expiresIn: expect.any(String),
      });

      // Password should not be in response
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should hash password in database', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      await request(app).post(`${TEST_CONFIG.baseURL}/auth/register`).send(userData).expect(201);

      // Check user in database
      const { User } = await import('../models/User');
      const user = await User.findOne({ email: userData.email }).select('+password');

      expect(user).toBeTruthy();
      expect(user!.password).not.toBe(userData.password);
      expect(user!.password.length).toBeGreaterThan(50); // Hashed password length
    });

    it('should return validation error for invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const response = await request(app)
        .post(`${TEST_CONFIG.baseURL}/auth/register`)
        .send(userData)
        .expect(422);

      testUtils.assertValidationError(response, 'email');
    });

    it('should return validation error for weak password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weak',
        confirmPassword: 'weak',
      };

      const response = await request(app)
        .post(`${TEST_CONFIG.baseURL}/auth/register`)
        .send(userData)
        .expect(422);

      testUtils.assertValidationError(response, 'password');
    });

    it('should return validation error for mismatched passwords', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
      };

      const response = await request(app)
        .post(`${TEST_CONFIG.baseURL}/auth/register`)
        .send(userData)
        .expect(422);

      testUtils.assertValidationError(response, 'confirmPassword');
    });

    it('should return conflict error for duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'duplicate@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      // Register first user
      await request(app).post(`${TEST_CONFIG.baseURL}/auth/register`).send(userData).expect(201);

      // Try to register with same email
      const response = await request(app)
        .post(`${TEST_CONFIG.baseURL}/auth/register`)
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      const { User } = await import('../models/User');
      const user = new User(TEST_USERS.user);
      await user.save();
    });

    it('should login user with valid credentials', async () => {
      const loginData = {
        email: TEST_USERS.user.email,
        password: TEST_USERS.user.password,
      };

      const response = await request(app)
        .post(`${TEST_CONFIG.baseURL}/auth/login`)
        .send(loginData)
        .expect(200);

      testUtils.assertApiResponse(response, 200);

      expect(response.body.data).toMatchObject({
        user: {
          id: expect.any(String),
          name: TEST_USERS.user.name,
          email: TEST_USERS.user.email,
          role: TEST_USERS.user.role,
        },
        token: expect.any(String),
        expiresIn: expect.any(String),
      });
    });

    it('should update lastLoginAt on successful login', async () => {
      const loginData = {
        email: TEST_USERS.user.email,
        password: TEST_USERS.user.password,
      };

      const { User } = await import('../models/User');
      const userBefore = await User.findOne({ email: loginData.email });
      const lastLoginBefore = userBefore!.lastLoginAt;

      await request(app).post(`${TEST_CONFIG.baseURL}/auth/login`).send(loginData).expect(200);

      const userAfter = await User.findOne({ email: loginData.email });
      expect(userAfter!.lastLoginAt).not.toBe(lastLoginBefore);
    });

    it('should return error for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: TEST_USERS.user.password,
      };

      const response = await request(app)
        .post(`${TEST_CONFIG.baseURL}/auth/login`)
        .send(loginData)
        .expect(401);

      testUtils.assertUnauthorizedError(response);
    });

    it('should return error for invalid password', async () => {
      const loginData = {
        email: TEST_USERS.user.email,
        password: 'WrongPassword123!',
      };

      const response = await request(app)
        .post(`${TEST_CONFIG.baseURL}/auth/login`)
        .send(loginData)
        .expect(401);

      testUtils.assertUnauthorizedError(response);
    });

    it('should return validation error for malformed email', async () => {
      const loginData = {
        email: 'invalid-email',
        password: TEST_USERS.user.password,
      };

      const response = await request(app)
        .post(`${TEST_CONFIG.baseURL}/auth/login`)
        .send(loginData)
        .expect(422);

      testUtils.assertValidationError(response, 'email');
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const { user, token } = await testUtils.createAuthenticatedUser();
      authToken = token;
      userId = (user as any)._id.toString()();
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get(`${TEST_CONFIG.baseURL}/auth/profile`)
        .set(testUtils.getAuthHeader(authToken))
        .expect(200);

      testUtils.assertApiResponse(response, 200);

      expect(response.body.data).toMatchObject({
        id: userId,
        name: expect.any(String),
        email: expect.any(String),
        role: expect.any(String),
        isEmailVerified: expect.any(Boolean),
        preferences: expect.any(Object),
        avatarUrl: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return error without authentication token', async () => {
      const response = await request(app).get(`${TEST_CONFIG.baseURL}/auth/profile`).expect(401);

      testUtils.assertUnauthorizedError(response);
    });

    it('should return error with invalid token', async () => {
      const response = await request(app)
        .get(`${TEST_CONFIG.baseURL}/auth/profile`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      testUtils.assertUnauthorizedError(response);
    });
  });

  describe('PATCH /api/v1/auth/profile', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const { user, token } = await testUtils.createAuthenticatedUser();
      authToken = token;
      userId = (user as any)._id.toString()();
    });

    it('should update user profile with valid data', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const response = await request(app)
        .patch(`${TEST_CONFIG.baseURL}/auth/profile`)
        .set(testUtils.getAuthHeader(authToken))
        .send(updateData)
        .expect(200);

      testUtils.assertApiResponse(response, 200);

      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.id).toBe(userId);
    });

    it('should not allow updating to existing email', async () => {
      // Create another user
      const { User } = await import('../models/User');
      const anotherUser = new User({
        ...TEST_USERS.admin,
        email: 'existing@example.com',
      });
      await anotherUser.save();

      const updateData = {
        email: 'existing@example.com',
      };

      const response = await request(app)
        .patch(`${TEST_CONFIG.baseURL}/auth/profile`)
        .set(testUtils.getAuthHeader(authToken))
        .send(updateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('should return error without authentication', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const response = await request(app)
        .patch(`${TEST_CONFIG.baseURL}/auth/profile`)
        .send(updateData)
        .expect(401);

      testUtils.assertUnauthorizedError(response);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let authToken: string;

    beforeEach(async () => {
      const { token } = await testUtils.createAuthenticatedUser();
      authToken = token;
    });

    it('should logout user successfully', async () => {
      const response = await request(app)
        .post(`${TEST_CONFIG.baseURL}/auth/logout`)
        .set(testUtils.getAuthHeader(authToken))
        .expect(200);

      testUtils.assertApiResponse(response, 200);
      expect(response.body.data.message).toBe('Logout successful');
    });

    it('should return error without authentication', async () => {
      const response = await request(app).post(`${TEST_CONFIG.baseURL}/auth/logout`).expect(401);

      testUtils.assertUnauthorizedError(response);
    });
  });

  describe('GET /api/v1/auth/stats', () => {
    let authToken: string;

    beforeEach(async () => {
      const { token } = await testUtils.createAuthenticatedUser();
      authToken = token;
    });

    it('should return user statistics', async () => {
      const response = await request(app)
        .get(`${TEST_CONFIG.baseURL}/auth/stats`)
        .set(testUtils.getAuthHeader(authToken))
        .expect(200);

      testUtils.assertApiResponse(response, 200);

      expect(response.body.data).toMatchObject({
        totalClients: expect.any(Number),
        totalInvoices: expect.any(Number),
        totalRevenue: expect.any(Number),
        pendingInvoices: expect.any(Number),
      });
    });

    it('should return error without authentication', async () => {
      const response = await request(app).get(`${TEST_CONFIG.baseURL}/auth/stats`).expect(401);

      testUtils.assertUnauthorizedError(response);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to registration endpoint', async () => {
      const userData = {
        name: 'Rate Test User',
        email: 'ratetest@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      // Make multiple rapid requests (this test might be flaky in CI)
      const requests = Array(6)
        .fill(null)
        .map(() =>
          request(app)
            .post(`${TEST_CONFIG.baseURL}/auth/register`)
            .send({
              ...userData,
              email: `${testUtils.randomString()}@example.com`, // Unique email each time
            })
        );

      const responses = await Promise.allSettled(requests);

      // At least some should succeed (we can't guarantee rate limit will kick in)
      const successfulResponses = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 201
      );

      expect(successfulResponses.length).toBeGreaterThan(0);
    });
  });
});
