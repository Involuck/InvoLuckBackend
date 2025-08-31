import type { Types } from 'mongoose';

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
