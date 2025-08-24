/**
 * Request ID middleware for InvoLuck Backend
 * Generates unique identifier for each request for tracing and logging
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware to generate and attach unique request ID
 *
 * The request ID is:
 * - Generated using UUID v4
 * - Attached to req.id for use in controllers and services
 * - Added to response headers for client-side tracing
 * - Used in logging for request correlation
 */
const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Check if request ID already exists in headers (from load balancer, etc.)
  const existingId = req.headers['x-request-id'] as string;

  // Use existing ID or generate new one
  const requestId = existingId || uuidv4();

  // Attach to request object
  req.id = requestId;

  // Add to response headers
  res.setHeader('X-Request-ID', requestId);

  next();
};

export { requestIdMiddleware };
export default requestIdMiddleware;
