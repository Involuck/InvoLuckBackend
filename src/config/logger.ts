/**
 * Pino logger configuration for InvoLuck Backend
 * Provides structured logging with request ID correlation
 */

import pino from 'pino';
import { LOG_LEVEL, isDevelopment } from './env';

// Base logger configuration
const loggerConfig: pino.LoggerOptions = {
  level: LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label: string) => ({ level: label }),
  },
  redact: {
    paths: ['password', 'token', 'authorization', 'cookie'],
    censor: '[REDACTED]',
  },
};

// Development configuration with pretty printing
if (isDevelopment()) {
  loggerConfig.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      singleLine: true,
      hideObject: false,
    },
  };
}

// Create logger instance
export const logger = pino(loggerConfig);

// Create child logger with context
export const createChildLogger = (context: Record<string, unknown>): pino.Logger => {
  return logger.child(context);
};

// HTTP logger configuration for requests
export const httpLoggerConfig = {
  logger,
  autoLogging: true,
  serializers: {
    req: (req: any) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      userAgent: req.headers?.['user-agent'],
      ip: req.ip,
      userId: req.user?.id,
    }),
    res: (res: any) => ({
      statusCode: res.statusCode,
    }),
  },
  customLogLevel: (req: any, res: any) => {
    if (res.statusCode >= 400) return 'warn';
    if (res.statusCode >= 300) return 'info';
    return 'info';
  },
  customReceivedMessage: (req: any) => `${req.method} ${req.url}`,
  customSuccessMessage: (req: any, res: any) => {
    return `${req.method} ${req.url} - ${res.statusCode}`;
  },
  customErrorMessage: (req: any, res: any) => {
    return `${req.method} ${req.url} - ${res.statusCode}`;
  },
};

export default logger;
