/**
 * Error handling middleware for InvoLuck Backend
 * Centralizes error processing and response formatting
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { CastError } from 'mongoose';
import { ApiError, ApiErrors } from '../utils/ApiError';
import { isProduction } from '../config/env';
import logger from '../config/logger';

/**
 * Handle Zod validation errors
 */
const handleZodError = (error: ZodError): ApiError => {
  const details = error.errors.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
  
  return ApiErrors.validation('Validation failed', details);
};

/**
 * Handle Mongoose cast errors (invalid ObjectId, etc.)
 */
const handleCastError = (error: CastError): ApiError => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return ApiErrors.badRequest(message);
};

/**
 * Handle Mongoose duplicate key errors
 */
const handleDuplicateKeyError = (error: any): ApiError => {
  const field = Object.keys(error.keyValue)[0];
  const value = error.keyValue[field];
  const message = `${field} '${value}' already exists`;
  
  return ApiErrors.conflict(message);
};

/**
 * Handle Mongoose validation errors
 */
const handleValidationError = (error: any): ApiError => {
  const details = Object.values(error.errors).map((err: any) => ({
    field: err.path,
    message: err.message,
    code: err.kind,
  }));
  
  return ApiErrors.validation('Validation failed', details);
};

/**
 * Handle JWT errors
 */
const handleJWTError = (): ApiError => {
  return ApiErrors.unauthorized('Invalid token');
};

/**
 * Handle JWT expired errors
 */
const handleJWTExpiredError = (): ApiError => {
  return ApiErrors.unauthorized('Token expired');
};

/**
 * Convert operational errors to ApiError
 */
const handleError = (error: any): ApiError => {
  // Already an ApiError
  if (error instanceof ApiError) {
    return error;
  }
  
  // Zod validation error
  if (error instanceof ZodError) {
    return handleZodError(error);
  }
  
  // Mongoose errors
  if (error instanceof CastError) {
    return handleCastError(error);
  }
  
  if (error.code === 11000) {
    return handleDuplicateKeyError(error);
  }
  
  if (error.name === 'ValidationError') {
    return handleValidationError(error);
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return handleJWTError();
  }
  
  if (error.name === 'TokenExpiredError') {
    return handleJWTExpiredError();
  }
  
  // Default to internal server error
  return ApiErrors.internal();
};

/**
 * Log error with appropriate level
 */
const logError = (error: ApiError, req: Request): void => {
  const logData = {
    msg: 'Request error',
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      stack: !isProduction() ? error.stack : undefined,
    },
    request: {
      id: req.id,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
    },
  };
  
  // Use appropriate log level based on status code
  if (error.statusCode >= 500) {
    logger.error(logData);
  } else if (error.statusCode >= 400) {
    logger.warn(logData);
  } else {
    logger.info(logData);
  }
};

/**
 * Main error handling middleware
 * Must be the last middleware in the chain
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Convert error to ApiError
  const apiError = handleError(error);
  
  // Log error
  logError(apiError, req);
  
  // Send error response
  res.status(apiError.statusCode).json({
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      details: apiError.details,
      ...(isProduction() ? {} : { stack: apiError.stack }),
    },
    requestId: req.id,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Async error handler for unhandled promise rejections
 */
export const handleAsyncError = (error: any): void => {
  logger.fatal({
    msg: 'Unhandled promise rejection',
    error: error.message,
    stack: error.stack,
  });
  
  // Graceful shutdown
  process.exit(1);
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = (error: any): void => {
  logger.fatal({
    msg: 'Uncaught exception',
    error: error.message,
    stack: error.stack,
  });
  
  // Graceful shutdown
  process.exit(1);
};

export default errorHandler;
