import crypto from 'crypto';

import mongoose from 'mongoose';

import logger from '../config/logger.js';
import RefreshToken from '../models/refreshTokenModel.js';
import authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/http.js';

import type { Request, Response } from 'express';

class AuthController {
  // ================== REGISTER ==================
  register = asyncHandler(async (req: Request, res: Response) => {
    const authResponse = await authService.register(req.body);

    logger.info({
      msg: 'User registration successful',
      userId: authResponse.user.id,
      email: authResponse.user.email,
      requestId: req.id
    });

    return created(res, authResponse);
  });

  // ================== LOGIN ==================
  login = asyncHandler(async (req: Request, res: Response) => {
    const authResponse = await authService.login(req.body);

    const refreshToken = await this.createRefreshToken(authResponse.user.id.toString(), req);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'strict'
    });

    logger.info({
      msg: 'User login successful',
      userId: authResponse.user.id,
      email: authResponse.user.email,
      requestId: req.id
    });

    return ok(res, authResponse);
  });

  // ================== CREATE REFRESH TOKEN ==================
  private readonly createRefreshToken = async (userId: string, req: Request): Promise<string> => {
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await RefreshToken.create({
      user: new mongoose.Types.ObjectId(userId),
      token: hashedToken,
      ip: req.ip,
      userAgent: req.get('User-Agent') || '',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return refreshToken;
  };

  // ================== REFRESH TOKEN ==================
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_REQUIRED',
          message: 'Refresh token is required'
        },
        requestId: req.id
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const tokenDoc = await RefreshToken.findOne({
      token: hashedToken
    }).populate('user');

    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token'
        },
        requestId: req.id
      });
    }

    const user = tokenDoc.user as any;
    const newAccessToken = authService.issueAccessToken(user._id.toString(), user.email, user.tokenVersion);

    logger.info({
      msg: 'Access token refreshed',
      userId: user._id.toString(),
      requestId: req.id
    });

    return ok(res, { token: newAccessToken });
  });

  // ================== LOGOUT ==================
  logout = asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (token) {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      await RefreshToken.findOneAndDelete({ token: hashedToken });
    }

    res.clearCookie('refreshToken');

    logger.info({
      msg: 'User logout',
      userId: req.user?.id,
      requestId: req.id
    });

    return ok(res, { message: 'Logout successful' });
  });

  // ================== FORGOT PASSWORD ==================
  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await authService.requestPasswordReset(email);

    return ok(res, {
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  });

  // ================== RESET PASSWORD ==================
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword, confirmPassword } = req.body;
    await authService.resetPassword(token, newPassword, confirmPassword);

    logger.info({ msg: 'Password reset successful', requestId: req.id });
    return ok(res, { message: 'Password reset successful' });
  });


  // ================== VERIFY EMAIL ==================
verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;
  await authService.verifyEmail(token);
  return ok(res, { message: 'Email verified successfully' });
});

// ================== RESEND VERIFICATION EMAIL ==================
resendVerificationEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  await authService.resendVerificationEmail(email);
  return ok(res, { message: 'Verification email resent' });
});


  // ================== PROFILE ==================
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const profile = await authService.getProfile(userId);
    return ok(res, profile);
  });

  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const updatedProfile = await authService.updateProfile(userId, req.body);

    logger.info({
      msg: 'User profile updated',
      userId,
      updatedFields: Object.keys(req.body),
      requestId: req.id
    });

    return ok(res, updatedProfile);
  });

  // ================== CHANGE PASSWORD ==================
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    await authService.changePassword(userId, req.body);

    logger.info({
      msg: 'Password changed successfully',
      userId,
      requestId: req.id
    });

    return ok(res, { message: 'Password changed successfully' });
  });

  // ================== DEACTIVATE ACCOUNT ==================
  deactivateAccount = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    await authService.deactivateAccount(userId);

    logger.info({ msg: 'Account deactivated', userId, requestId: req.id });
    return ok(res, { message: 'Account deactivated successfully' });
  });

  // ================== USER STATS ==================
  getUserStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const stats = await authService.getUserStats(userId);
    return ok(res, stats);
  });

  // ================== UPDATE USER ROLE (ADMIN ONLY) ==================
updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { userId, role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }


  

  const updatedUser = await authService.updateUserRole(userId, role);

  logger.info({
    msg: 'User role updated',
    userId,
    newRole: role,
    requestId: req.id
  });

  return ok(res, updatedUser);
});

logoutAllDevices = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await authService.logoutAllDevices(userId);

  return ok(res, { message: 'Logged out from all devices successfully' });
});


}

export default new AuthController();
