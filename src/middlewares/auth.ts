import jwt from 'jsonwebtoken';

import { JWT_EXPIRES_IN, JWT_SECRET } from '../config/env.js';
import logger from '../config/logger.js';
import { User } from '../models/User.js';
import { ApiErrors } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

import type { Request, Response, NextFunction } from 'express';
import type { Types } from 'mongoose';

interface JwtPayload {
  id: string;
  email: string;
  tokenVersion: number; 
  iat: number;
  exp: number;
}

// Extract token from Authorization header
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

// Verify JWT token
const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiErrors.unauthorized('Token has expired', {
        code: 'TOKEN_EXPIRED'
      });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw ApiErrors.unauthorized('Invalid token', { code: 'INVALID_TOKEN' });
    }
    throw ApiErrors.unauthorized('Token verification failed', {
      code: 'TOKEN_VERIFICATION_FAILED'
    });
  }
};

// Authentication middleware
const authMiddleware = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);

  if (!token) {
    throw ApiErrors.unauthorized('No token provided', { code: 'NO_TOKEN' });
  }

  const decoded = verifyToken(token);

  const user = await User.findById(decoded.id).select(
    '_id email name role isEmailVerified preferences createdAt tokenVersion'
  );

  if (!user) {
    logger.warn({
      msg: 'Token valid but user not found',
      userId: decoded.id,
      requestId: req.id
    });
    throw ApiErrors.unauthorized('User not found', {
      code: 'USER_NOT_FOUND'
    });
  }

  req.user = {
    id: (user as any)._id.toString(),
    _id: user._id as Types.ObjectId,
    email: user.email,
    name: user.name,
    role: user.role
  };

  logger.debug({
    msg: 'User authenticated',
    userId: (user as any)._id.toString(),
    email: user.email,
    requestId: req.id
  });

  if (!user || !user.isActive) {
  logger.warn({
    msg: 'Token valid but user inactive or not found',
    userId: decoded.id,
    requestId: req.id
  });
  throw ApiErrors.unauthorized('User not found or deactivated', {
    code: 'USER_NOT_ACTIVE'
  });
}



if (decoded.tokenVersion !== user.tokenVersion) {
  throw ApiErrors.unauthorized('Token has been revoked', { code: 'TOKEN_REVOKED' });
}
  next();
});

// Optional authentication middleware
export const optionalAuthMiddleware = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractToken(req);

    if (!token) {
      next();
      return;
    }

    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select(
        '_id email name role isEmailVerified preferences createdAt tokenVersion'
      );

      if (user) {
        req.user = {
          id: (user as any)._id.toString(),
          _id: user._id as Types.ObjectId,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    } catch (error) {
      logger.debug({
        msg: 'Optional auth failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.id
      });
    }

    
    next();
  }
);

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiErrors.unauthorized('Authentication required', {
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role || 'user';

    if (!allowedRoles.includes(userRole)) {
      logger.warn({
        msg: 'Access denied - insufficient role',
        userId: req.user.id,
        userRole,
        requiredRoles: allowedRoles,
        requestId: req.id
      });
      throw ApiErrors.forbidden('Insufficient permissions', {
        code: 'FORBIDDEN'
      });
    }

    next();
  });
};

// Ownership-based authorization middleware
export const requireOwnershipOrAdmin = (resourceIdField = 'userId') => {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiErrors.unauthorized('Authentication required', {
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role || 'user';
    const userId = req.user.id;

    if (userRole === 'admin') {
      next();
      return;
    }

    const resourceUserId = req.params[resourceIdField] || req.body[resourceIdField];

    if (resourceUserId !== userId) {
      logger.warn({
        msg: 'Access denied - resource ownership check failed',
        userId,
        resourceUserId,
        requestId: req.id
      });
      throw ApiErrors.forbidden('Access denied - you can only access your own resources', {
        code: 'NOT_OWNER'
      });
    }

    next();
  });
};




export { authMiddleware };
export default authMiddleware;
