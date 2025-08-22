/**
 * Authentication service for InvoLuck Backend
 * Handles user registration, login, and token management
 */

import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env';
import { ApiErrors } from '../utils/ApiError';
import logger from '../config/logger';
import { RegisterInput, LoginInput, ChangePasswordInput, UpdateProfileInput } from '../validators/auth.schema';

// Auth response interface
export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isEmailVerified: boolean;
    preferences: any;
    createdAt: Date;
  };
  token: string;
  expiresIn: string;
}

// User profile interface
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  preferences: any;
  avatarUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

class AuthService {
  /**
   * Generate JWT token for user
   */
  private generateToken(userId: string, email: string): string {
    return jwt.sign(
      { id: userId, email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  /**
   * Create auth response object
   */
  private createAuthResponse(user: IUser): AuthResponse {
    const token = this.generateToken(user._id.toString(), user.email);
    
    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        preferences: user.preferences,
        createdAt: user.createdAt,
      },
      token,
      expiresIn: JWT_EXPIRES_IN,
    };
  }

  /**
   * Register new user
   */
  async register(userData: RegisterInput): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw ApiErrors.conflict('User with this email already exists');
      }

      // Create new user
      const user = new User({
        name: userData.name,
        email: userData.email,
        password: userData.password,
      });

      await user.save();

      logger.info({
        msg: 'User registered successfully',
        userId: user._id.toString(),
        email: user.email,
      });

      return this.createAuthResponse(user);
    } catch (error) {
      logger.error({
        msg: 'User registration failed',
        email: userData.email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Authenticate user login
   */
  async login(credentials: LoginInput): Promise<AuthResponse> {
    try {
      // Find user with password
      const user = await User.findOne({ email: credentials.email, isActive: true })
        .select('+password');

      if (!user) {
        throw ApiErrors.unauthorized('Invalid email or password');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(credentials.password);
      if (!isPasswordValid) {
        throw ApiErrors.unauthorized('Invalid email or password');
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      logger.info({
        msg: 'User logged in successfully',
        userId: user._id.toString(),
        email: user.email,
      });

      return this.createAuthResponse(user);
    } catch (error) {
      logger.warn({
        msg: 'Login attempt failed',
        email: credentials.email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<UserProfile> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw ApiErrors.notFound('User not found');
      }

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        preferences: user.preferences,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      logger.error({
        msg: 'Failed to get user profile',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: UpdateProfileInput): Promise<UserProfile> {
    try {
      // Check if email is being changed and if it's already taken
      if (updateData.email) {
        const existingUser = await User.findOne({
          email: updateData.email,
          _id: { $ne: userId },
        });
        
        if (existingUser) {
          throw ApiErrors.conflict('Email is already taken');
        }
      }

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!user) {
        throw ApiErrors.notFound('User not found');
      }

      logger.info({
        msg: 'User profile updated',
        userId: user._id.toString(),
        updatedFields: Object.keys(updateData),
      });

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        preferences: user.preferences,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      logger.error({
        msg: 'Failed to update user profile',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, passwordData: ChangePasswordInput): Promise<void> {
    try {
      const user = await User.findById(userId).select('+password');
      
      if (!user) {
        throw ApiErrors.notFound('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(passwordData.currentPassword);
      if (!isCurrentPasswordValid) {
        throw ApiErrors.badRequest('Current password is incorrect');
      }

      // Update password
      user.password = passwordData.newPassword;
      await user.save();

      logger.info({
        msg: 'Password changed successfully',
        userId: user._id.toString(),
      });
    } catch (error) {
      logger.error({
        msg: 'Password change failed',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Verify JWT token and return user
   */
  async verifyToken(token: string): Promise<IUser> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
      
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        throw ApiErrors.unauthorized('Invalid token - user not found');
      }

      return user;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw ApiErrors.unauthorized('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw ApiErrors.unauthorized('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Generate password reset token (stub for future implementation)
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await User.findOne({ email, isActive: true });
      
      if (!user) {
        // Don't reveal if email exists
        logger.warn({
          msg: 'Password reset requested for non-existent email',
          email,
        });
        return;
      }

      // Generate reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      logger.info({
        msg: 'Password reset token generated',
        userId: user._id.toString(),
        email: user.email,
      });

      // TODO: Send password reset email
      // await mailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
      logger.error({
        msg: 'Password reset request failed',
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateAccount(userId: string): Promise<void> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true }
      );

      if (!user) {
        throw ApiErrors.notFound('User not found');
      }

      logger.info({
        msg: 'User account deactivated',
        userId: user._id.toString(),
        email: user.email,
      });
    } catch (error) {
      logger.error({
        msg: 'Account deactivation failed',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<{
    totalClients: number;
    totalInvoices: number;
    totalRevenue: number;
    pendingInvoices: number;
  }> {
    try {
      const [clientStats, invoiceStats] = await Promise.all([
        // TODO: Import Client model when available
        // Client.countDocuments({ userId }),
        Promise.resolve(0),
        // TODO: Import Invoice model when available  
        // Invoice.aggregate([...])
        Promise.resolve({
          totalInvoices: 0,
          totalRevenue: 0,
          pendingInvoices: 0,
        }),
      ]);

      return {
        totalClients: clientStats,
        totalInvoices: invoiceStats.totalInvoices || 0,
        totalRevenue: invoiceStats.totalRevenue || 0,
        pendingInvoices: invoiceStats.pendingInvoices || 0,
      };
    } catch (error) {
      logger.error({
        msg: 'Failed to get user stats',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

export const authService = new AuthService();
export default authService;
