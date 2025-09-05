import { Router } from 'express';

import { authRateLimit, moderateRateLimit } from '../config/rateLimit.js';
import authController from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validators/auth.schema.js';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post(
  '/register',
  authRateLimit,
  validate({ body: registerSchema }),
  authController.register
);

/**
 * POST /api/v1/auth/login
 * Authenticate user login
 */
router.post('/login', authRateLimit, validate({ body: loginSchema }), authController.login);

/**
 * POST /api/v1/auth/forgot-password
 * Request password reset
 */
router.post(
  '/forgot-password',
  authRateLimit,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword
);

/**
 * POST /api/v1/auth/reset-password
 * Reset password using token
 */
router.post(
  '/reset-password',
  authRateLimit,
  validate({ body: resetPasswordSchema }),
  authController.resetPassword
);

/**
 * GET /api/v1/auth/profile
 * Get current user profile
 */
router.get('/profile', authMiddleware, authController.getProfile);

/**
 * PATCH /api/v1/auth/profile
 * Update user profile
 */
router.patch(
  '/profile',
  authMiddleware,
  moderateRateLimit,
  validate({ body: updateProfileSchema }),
  authController.updateProfile
);

/**
 * POST /api/v1/auth/change-password
 * Change user password
 */
router.post(
  '/change-password',
  authMiddleware,
  authRateLimit,
  validate({ body: changePasswordSchema }),
  authController.changePassword
);

router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationEmail);


/**
 * POST /api/v1/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * DELETE /api/v1/auth/account
 * Deactivate user account
 */
router.delete('/account', authMiddleware, authRateLimit, authController.deactivateAccount);

/**
 * GET /api/v1/auth/stats
 * Get user statistics
 */
router.get('/stats', authMiddleware, authController.getUserStats);

export default router;
