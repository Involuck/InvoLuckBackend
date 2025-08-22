/**
 * Authentication controller for InvoLuck Backend
 * Handles HTTP requests for user authentication and profile management
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created, noContent } from '../utils/http';
import authService from '../services/auth.service';
import logger from '../config/logger';

class AuthController {
  /**
   * POST /api/v1/auth/register
   * Register a new user
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const authResponse = await authService.register(req.body);
    
    logger.info({
      msg: 'User registration successful',
      userId: authResponse.user.id,
      email: authResponse.user.email,
      requestId: req.id,
    });

    return created(res, authResponse);
  });

  /**
   * POST /api/v1/auth/login
   * Authenticate user login
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const authResponse = await authService.login(req.body);
    
    logger.info({
      msg: 'User login successful',
      userId: authResponse.user.id,
      email: authResponse.user.email,
      requestId: req.id,
    });

    return ok(res, authResponse);
  });

  /**
   * POST /api/v1/auth/forgot-password
   * Request password reset
   */
  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    await authService.requestPasswordReset(req.body.email);
    
    // Always return success to prevent email enumeration
    return ok(res, {
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  });

  /**
   * GET /api/v1/auth/profile
   * Get current user profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const profile = await authService.getProfile(userId);
    
    return ok(res, profile);
  });

  /**
   * PATCH /api/v1/auth/profile
   * Update user profile
   */
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const updatedProfile = await authService.updateProfile(userId, req.body);
    
    logger.info({
      msg: 'User profile updated',
      userId,
      updatedFields: Object.keys(req.body),
      requestId: req.id,
    });

    return ok(res, updatedProfile);
  });

  /**
   * POST /api/v1/auth/change-password
   * Change user password
   */
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    await authService.changePassword(userId, req.body);
    
    logger.info({
      msg: 'Password changed successfully',
      userId,
      requestId: req.id,
    });

    return ok(res, {
      message: 'Password changed successfully',
    });
  });

  /**
   * POST /api/v1/auth/logout
   * Logout user (client-side token removal)
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    // In a JWT-based system, logout is typically handled client-side
    // by removing the token from storage. Server-side logout would
    // require token blacklisting which is not implemented here.
    
    logger.info({
      msg: 'User logout',
      userId: req.user!.id,
      requestId: req.id,
    });

    return ok(res, {
      message: 'Logout successful',
    });
  });

  /**
   * DELETE /api/v1/auth/account
   * Deactivate user account
   */
  deactivateAccount = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    await authService.deactivateAccount(userId);
    
    logger.info({
      msg: 'Account deactivated',
      userId,
      requestId: req.id,
    });

    return ok(res, {
      message: 'Account deactivated successfully',
    });
  });

  /**
   * GET /api/v1/auth/stats
   * Get user statistics
   */
  getUserStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const stats = await authService.getUserStats(userId);
    
    return ok(res, stats);
  });
}

export default new AuthController();
