import mongoose, { Schema } from 'mongoose';

import type { Document } from 'mongoose';
// import crypto from 'crypto';

export interface IRefreshToken extends Document {
  user: mongoose.Types.ObjectId;
  token: string;
  ip: string;
  userAgent: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true }, // store hashed token
    ip: { type: String },
    userAgent: { type: String },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

// Optional: Index for quick token lookup
refreshTokenSchema.index({ token: 1 });

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
export default RefreshToken;
