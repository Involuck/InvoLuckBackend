import jwt from 'jsonwebtoken';

import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env.js';
import logger from '../config/logger.js';
import { User } from '../models/User.js';
import { ApiErrors } from '../utils/ApiError.js';

import type { IUser } from '../models/User.js';
import type {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  UpdateProfileInput
} from '../validators/auth.schema.js';
import type { Secret, SignOptions } from 'jsonwebtoken';
// import { string, undefined } from 'zod';

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
  // Generate JWT token for user
  private generateToken(userId: string, email: string): string {
    return jwt.sign(
      { id: userId, email },
      JWT_SECRET as Secret,
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    );
  }

  // Create auth response object
  private createAuthResponse(user: IUser): AuthResponse {
    const token = this.generateToken((user as any)._id.toString(), user.email);

    return {
      user: {
        id: (user as any)._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        preferences: user.preferences,
        createdAt: user.createdAt
      },
      token,
      expiresIn: JWT_EXPIRES_IN
    };
  }

  // Public wrapper for generating access tokens
  public issueAccessToken(userId: string, email: string): string {
    return this.generateToken(userId, email);
  }

  // Register new user
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
        password: userData.password
      });

      await user.save();

      logger.info({
        msg: 'User registered successfully',
        userId: (user as any)._id.toString(),
        email: user.email
      });

      return this.createAuthResponse(user);
    } catch (error) {
      logger.error({
        msg: 'User registration failed',
        email: userData.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  // Authenticate user login
  async login(credentials: LoginInput): Promise<AuthResponse> {
    try {
      // Find user with password
      const user = await User.findOne({
        email: credentials.email,
        isActive: true
      }).select('+password');

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

      // Generate email verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // TODO: use mailService here
      // await mailService.sendVerificationEmail(user.email, verificationToken);


      logger.info({
        msg: 'User logged in successfully',
        userId: (user as any)._id.toString(),
        email: user.email
      });

      return this.createAuthResponse(user);
    } catch (error) {
      logger.warn({
        msg: 'Login attempt failed',
        email: credentials.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }


  async verifyEmail(token: string): Promise<void> {
  const hashedToken = require('crypto')
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: new Date() }
  });

  if (!user) {
    throw ApiErrors.badRequest('Invalid or expired verification token');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  logger.info({
    msg: 'User email verified successfully',
    userId: (user as any)._id.toString(),
    email: user.email
  });
}
  
async resendVerificationEmail(email: string): Promise<void> {
  const user = await User.findOne({ email, isActive: true });
  if (!user) {
    throw ApiErrors.notFound('User not found');
  }

  if (user.isEmailVerified) {
    throw ApiErrors.badRequest('Email is already verified');
  }

  const verificationToken = user.generateEmailVerificationToken();
  await user.save();

  // TODO: use mailService here
  // await mailService.sendVerificationEmail(user.email, verificationToken);

  logger.info({
    msg: 'Verification email resent',
    userId: (user as any)._id.toString(),
    email: user.email
  });
}


  // Get user profile by ID
  async getProfile(userId: string): Promise<UserProfile> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw ApiErrors.notFound('User not found');
      }

      return {
        id: (user as any)._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        preferences: user.preferences,
        avatarUrl: user.avatar || '',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      logger.error({
        msg: 'Failed to get user profile',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Update user profile
  async updateProfile(userId: string, updateData: UpdateProfileInput): Promise<UserProfile> {
    try {
      // Check if email is being changed and if it's already taken
      if (updateData.email) {
        const existingUser = await User.findOne({
          email: updateData.email,
          _id: { $ne: userId }
        });

        if (existingUser) {
          throw ApiErrors.conflict('Email is already taken');
        }
      }

      const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true
      });

      if (!user) {
        throw ApiErrors.notFound('User not found');
      }

      logger.info({
        msg: 'User profile updated',
        userId: (user as any)._id.toString(),
        updatedFields: Object.keys(updateData)
      });

      return {
        id: (user as any)._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        preferences: user.preferences,
        avatarUrl: user.avatar || '',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      logger.error({
        msg: 'Failed to update user profile',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Change user password
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
        userId: (user as any)._id.toString()
      });
    } catch (error) {
      logger.error({
        msg: 'Password change failed',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string, confirmPassword?: string): Promise<void> {
    try {
      if (confirmPassword && newPassword !== confirmPassword) {
        throw ApiErrors.badRequest('Passwords do not match');
      }

      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
        isActive: true
      }).select('+password');

      if (!user) throw ApiErrors.badRequest('Invalid or expired password reset token');

      user.password = newPassword;

      // IMPORTANT: clear using NULL (not undefined) unless your types explicitly allow undefined
      user.passwordResetToken = null as any;
      user.passwordResetExpires = null as any;

      await user.save();

      logger.info({
        msg: 'Password reset successful',
        userId: (user as any)._id.toString(),
        email: user.email
      });
    } catch (error) {
      logger.error({
        msg: 'Password reset failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Verify JWT token and return user
  async verifyToken(token: string): Promise<IUser> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
      };

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

  // Generate password reset token (stub for future implementation)
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await User.findOne({ email, isActive: true });

      if (!user) {
        // Don't reveal if email exists
        logger.warn({
          msg: 'Password reset requested for non-existent email',
          email
        });
        return;
      }

      // Generate reset token
      user.generatePasswordResetToken();
      await user.save();

      logger.info({
        msg: 'Password reset token generated',
        userId: (user as any)._id.toString(),
        email: user.email
      });

      // await mailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
      logger.error({
        msg: 'Password reset request failed',
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Deactivate user account
  async deactivateAccount(userId: string): Promise<void> {
    try {
      const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });

      if (!user) {
        throw ApiErrors.notFound('User not found');
      }

      logger.info({
        msg: 'User account deactivated',
        userId: (user as any)._id.toString(),
        email: user.email
      });
    } catch (error) {
      logger.error({
        msg: 'Account deactivation failed',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Get user statistics
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
          pendingInvoices: 0
        })
      ]);

      return {
        totalClients: clientStats,
        totalInvoices: invoiceStats.totalInvoices || 0,
        totalRevenue: invoiceStats.totalRevenue || 0,
        pendingInvoices: invoiceStats.pendingInvoices || 0
      };
    } catch (error) {
      logger.error({
        msg: 'Failed to get user stats',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

export const authService = new AuthService();
export default authService;
