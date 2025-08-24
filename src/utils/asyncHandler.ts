/**
 * Async handler wrapper for InvoLuck Backend
 * Wraps async route handlers to properly catch and forward errors
 */

import { Request, Response, NextFunction } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

/**
 * Wraps async route handlers to catch errors and pass them to error middleware
 *
 * @param fn - Async route handler function
 * @returns Express middleware function
 *
 * @example
 * app.get('/users', asyncHandler(async (req, res) => {
 *   const users = await userService.getAll();
 *   res.json({ success: true, data: users });
 * }));
 */
const asyncHandler = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export { asyncHandler };
export default asyncHandler;
