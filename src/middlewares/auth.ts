/**
 * Authentication middleware for InvoLuck Backend
 * Verifies JWT tokens and attaches user information to requests
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { JWT_SECRET } from '../config/env';
import { ApiErrors } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import logger from '../config/logger';

interface JwtPayload {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Extract token from Authorization header
 */
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Check for Bearer token format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Verify JWT token and return payload
 */
const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiErrors.unauthorized('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw ApiErrors.unauthorized('Invalid token');
    }
    throw ApiErrors.unauthorized('Token verification failed');
  }
};

/**
 * Main authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Extract token from header
    const token = extractToken(req);

    if (!token) {
      throw ApiErrors.unauthorized('No token provided');
    }

    // Verify token
    const decoded = verifyToken(token);

    // Find user in database
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      logger.warn({
        msg: 'Token valid but user not found',
        userId: decoded.id,
        requestId: req.id,
      });
      throw ApiErrors.unauthorized('User not found');
    }

    // Attach user to request
    req.user = {
      id: (user as any)._id.toString(),
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    logger.debug({
      msg: 'User authenticated',
      userId: (user as any)._id.toString(),
      email: user.email,
      requestId: req.id,
    });

    next();
  }
);

/**
 * Optional authentication middleware
 * Similar to authMiddleware but doesn't throw error if no token
 */
export const optionalAuthMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = extractToken(req);

    if (!token) {
      return next();
    }

    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password');

      if (user) {
        req.user = {
          id: (user as any)._id.toString(),
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    } catch (error) {
      // Log error but don't throw - this is optional auth
      logger.debug({
        msg: 'Optional auth failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.id,
      });
    }

    next();
  }
);

/**
 * Role-based authorization middleware factory
 */
export const requireRole = (allowedRoles: string[]) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiErrors.unauthorized('Authentication required');
    }

    const userRole = req.user.role || 'user';

    if (!allowedRoles.includes(userRole)) {
      logger.warn({
        msg: 'Access denied - insufficient role',
        userId: req.user.id,
        userRole,
        requiredRoles: allowedRoles,
        requestId: req.id,
      });
      throw ApiErrors.forbidden('Insufficient permissions');
    }

    next();
  });
};

/**
 * Check if user owns resource or is admin
 */
export const requireOwnershipOrAdmin = (resourceIdField = 'userId') => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiErrors.unauthorized('Authentication required');
    }

    const userRole = req.user.role || 'user';
    const userId = req.user.id;

    // Admin can access any resource
    if (userRole === 'admin') {
      return next();
    }

    // Check resource ownership
    const resourceUserId = req.params[resourceIdField] || req.body[resourceIdField];

    if (resourceUserId !== userId) {
      logger.warn({
        msg: 'Access denied - resource ownership check failed',
        userId,
        resourceUserId,
        requestId: req.id,
      });
      throw ApiErrors.forbidden('Access denied - you can only access your own resources');
    }

    next();
  });
};

export default authMiddleware;
