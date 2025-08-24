/**
 * Not Found middleware for InvoLuck Backend
 * Handles requests to non-existent routes
 */

import { Request, Response, NextFunction } from 'express';
import { ApiErrors } from '../utils/ApiError';
import logger from '../config/logger';

/**
 * 404 Not Found middleware
 * Should be placed after all route definitions but before error handler
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  logger.warn({
    msg: 'Route not found',
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    requestId: req.id,
  });

  const error = ApiErrors.notFound(`Route ${req.method} ${req.url} not found`);
  next(error);
};

export default notFoundHandler;
