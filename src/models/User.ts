import bcrypt from 'bcryptjs';
import mongoose, { Schema } from 'mongoose';

import type { Document } from 'mongoose';

// User interface extending Mongoose Document
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  avatar?: string;
  preferences: {
    currency: string;
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      browser: boolean;
      invoiceReminders: boolean;
      paymentReceived: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword: (candidatePassword: string) => Promise<boolean>;
  generatePasswordResetToken: () => string;
  generateEmailVerificationToken: () => string;
  toJSON: () => any;
}

// User schema definition
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false // Don't include password in queries by default
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    emailVerificationToken: {
      type: String,
      select: false
    },

    passwordResetToken: {
      type: String,
      select: false
    },

    passwordResetExpires: {
      type: Date,
      select: false
    },

    lastLoginAt: {
      type: Date
    },

    isActive: {
      type: Boolean,
      default: true
    },

    avatar: {
      type: String
    },

    preferences: {
      currency: {
        type: String,
        default: 'USD',
        maxlength: [3, 'Currency code cannot exceed 3 characters']
      },
      language: {
        type: String,
        default: 'en',
        maxlength: [5, 'Language code cannot exceed 5 characters']
      },
      timezone: {
        type: String,
        default: 'UTC'
      },
      notifications: {
        email: { type: Boolean, default: true },
        browser: { type: Boolean, default: true },
        invoiceReminders: { type: Boolean, default: true },
        paymentReceived: { type: Boolean, default: true }
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
    return;
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Update lastLoginAt when user logs in
userSchema.pre('save', function (next) {
  if (this.isModified('lastLoginAt') && !this.isNew) {
    this.lastLoginAt = new Date();
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function (): string {
  const resetToken = require('crypto').randomBytes(32).toString('hex');

  this.passwordResetToken = require('crypto').createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return resetToken;
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function (): string {
  const verificationToken = require('crypto').randomBytes(32).toString('hex');

  this.emailVerificationToken = require('crypto')
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  return verificationToken;
};

// Override toJSON to exclude sensitive fields
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();

  delete userObject.password;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.emailVerificationToken;
  delete userObject.__v;

  return userObject;
};

// Static methods
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

userSchema.statics.findActiveUsers = function () {
  return this.find({ isActive: true });
};

// Virtual for full profile URL
userSchema.virtual('profileUrl').get(function () {
  return `/api/v1/users/${this._id}`;
});

// Virtual for avatar URL
userSchema.virtual('avatarUrl').get(function () {
  if (this.avatar) {
    return this.avatar.startsWith('http') ? this.avatar : `/uploads/avatars/${this.avatar}`;
  }
  return `https://www.gravatar.com/avatar/${require('crypto')
    .createHash('md5')
    .update(this.email)
    .digest('hex')}?s=200&d=identicon`;
});

// Create and export the User model
export const User = mongoose.model<IUser>('User', userSchema);
export default User;
