/**
 * Validation middleware for InvoLuck Backend
 * Uses Zod schemas to validate request data
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

type ZodSchema = z.ZodSchema;
import { ApiErrors, ErrorDetail } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import logger from '../config/logger.js';

/**
 * Request parts that can be validated
 */
export type ValidationTarget = 'body' | 'params' | 'query' | 'headers';

/**
 * Validation schemas interface
 */
export interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
  headers?: ZodSchema;
}

/**
 * Convert Zod error to API error details
 */
const formatZodError = (error: ZodError): ErrorDetail[] => {
  return error.errors.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
};

/**
 * Validate specific part of request
 */
const validateRequestPart = (data: any, schema: ZodSchema, target: ValidationTarget): any => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = formatZodError(error);
      throw ApiErrors.validation(`Validation failed for ${target}`, details);
    }
    throw error;
  }
};

/**
 * Main validation middleware factory
 *
 * @param schemas - Object containing schemas for different request parts
 * @returns Express middleware function
 *
 * @example
 * app.post('/users', validate({ body: userCreateSchema }), createUser);
 */
const validate = (schemas: ValidationSchemas) => {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Validate body if schema provided
      if (schemas.body) {
        req.body = validateRequestPart(req.body, schemas.body, 'body');
      }

      // Validate params if schema provided
      if (schemas.params) {
        req.params = validateRequestPart(req.params, schemas.params, 'params');
      }

      // Validate query if schema provided
      if (schemas.query) {
        req.query = validateRequestPart(req.query, schemas.query, 'query');
      }

      // Validate headers if schema provided
      if (schemas.headers) {
        req.headers = validateRequestPart(req.headers, schemas.headers, 'headers');
      }

      logger.debug({
        msg: 'Request validation successful',
        requestId: req.id,
        path: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      logger.warn({
        msg: 'Request validation failed',
        requestId: req.id,
        path: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  });
};

/**
 * Validate only request body
 * Convenience function for the most common validation case
 */
export const validateBody = (schema: ZodSchema) => {
  return validate({ body: schema });
};

/**
 * Validate only request params
 */
export const validateParams = (schema: ZodSchema) => {
  return validate({ params: schema });
};

/**
 * Validate only request query
 */
export const validateQuery = (schema: ZodSchema) => {
  return validate({ query: schema });
};

/**
 * Validate file upload
 */
export const validateFile = (options: {
  required?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
}) => {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const file = req.file;
    const { required = false, maxSize = 5 * 1024 * 1024, allowedTypes = [] } = options;

    // Check if file is required
    if (required && !file) {
      throw ApiErrors.badRequest('File is required');
    }

    // If no file and not required, skip validation
    if (!file) {
      return next();
    }

    // Check file size
    if (file.size > maxSize) {
      throw ApiErrors.badRequest(`File size too large. Maximum allowed: ${maxSize} bytes`);
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      throw ApiErrors.badRequest(
        `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      );
    }

    logger.debug({
      msg: 'File validation successful',
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      requestId: req.id,
    });

    next();
  });
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // MongoDB ObjectId parameter
  objectIdParam: z.object({
    id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId format'),
  }),

  // Pagination query
  paginationQuery: z.object({
    page: z.coerce.number().min(1).optional(),
    limit: z.coerce.number().min(1).max(100).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),

  // Search query
  searchQuery: z.object({
    q: z.string().min(1).max(100).optional(),
  }),
};

export { validate };
export default validate;
