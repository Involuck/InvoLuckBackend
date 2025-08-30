import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  APP_URL: z.string().url().default('http://localhost:5000'),

  API_KEY: z.string().min(1, 'API key is required'),

  // Database
  MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),

  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Email (SMTP)
  SMTP_HOST: z.string().min(1, 'SMTP host is required'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().default('no-reply@involuck.dev'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  // File Upload
  MAX_FILE_SIZE: z.coerce.number().default(5242880), // 5MB
  ALLOWED_FILE_EXTENSIONS: z.string().default('.jpg,.jpeg,.png,.pdf,.doc,.docx'),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Security
  SECURITY_HEADERS: z.coerce.boolean().default(true),

  // Development
  DEV_MODE: z.coerce.boolean().default(false),
  ENABLE_API_DOCS: z.coerce.boolean().default(false)
});

// Validate and parse environment variables
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment configuration:');
  parseResult.error.issues.forEach(issue => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

export const env = parseResult.data;

// Helper functions
export const isDevelopment = (): boolean => env.NODE_ENV === 'development';
export const isProduction = (): boolean => env.NODE_ENV === 'production';
export const isTest = (): boolean => env.NODE_ENV === 'test';

// Export commonly used values
export const {
  NODE_ENV,
  PORT,
  APP_URL,
  API_KEY,
  MONGODB_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  CORS_ORIGIN,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  MAX_FILE_SIZE,
  ALLOWED_FILE_EXTENSIONS,
  LOG_LEVEL,
  SECURITY_HEADERS,
  DEV_MODE,
  ENABLE_API_DOCS
} = env;
