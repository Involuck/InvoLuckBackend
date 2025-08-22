/**
 * Express type extensions for InvoLuck Backend
 * Extends Request interface to include user authentication and request ID
 */

import { Types } from 'mongoose';

export interface AuthenticatedUser {
  id: string;
  _id: Types.ObjectId;
  email: string;
  name?: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: AuthenticatedUser;
      file?: Multer.File;
      files?: Multer.File[];
    }
  }
}

export {};
