import { z } from 'zod';

// User registration schema
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must not exceed 50 characters')
      .trim(),
    email: z.string().email('Invalid email format').toLowerCase().trim(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must not exceed 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      ),
    confirmPassword: z.string()
  })
  .refine(d => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

// User login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required')
});

// Password reset request (forgot password)
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim()
});

// Reset password (token + new password)
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must not exceed 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      ),
    confirmPassword: z.string()
  })
  .refine(d => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

// (NEW) Token-only schema — useful if you ever have an endpoint to just verify token.
// This fixes the "Cannot find name 'passwordResetTokenSchema'" error.
export const passwordResetTokenSchema = z.object({
  token: z.string().min(1, 'Reset token is required')
});

// Change password (authenticated)
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must not exceed 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      ),
    confirmNewPassword: z.string()
  })
  .refine(d => d.newPassword === d.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword']
  });

// Refresh token
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

// Update profile
export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must not exceed 50 characters')
      .trim()
      .optional(),
    email: z.string().email('Invalid email format').toLowerCase().trim().optional()
  })
  .refine(d => Object.keys(d).length > 0, {
    message: 'At least one field must be provided'
  });

// Email verification
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required')
});

// Resend verification email
export const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim()
});

// Types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type PasswordResetTokenInput = z.infer<typeof passwordResetTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
