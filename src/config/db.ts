/**
 * MongoDB database connection configuration for InvoLuck Backend
 * Handles connection, reconnection, and error management
 */

import mongoose from 'mongoose';
import { MONGODB_URI, isDevelopment, isTest } from './env.js';
import logger from './logger.js';

// Connection options
const connectionOptions: mongoose.ConnectOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  /* bufferMaxEntries: 0, */
};

// Database connection class
class DatabaseConnection {
  private retryCount = 0;
  private maxRetries = 5;
  private retryDelay = 5000;

  /**
   * Connect to MongoDB database
   */
  async connect(): Promise<void> {
    try {
      // Set mongoose options
      mongoose.set('strictQuery', true);

      // Enable debug mode in development
      if (isDevelopment()) {
        mongoose.set('debug', true);
      }

      // Connect to database
      await mongoose.connect(MONGODB_URI, connectionOptions);

      logger.info({
        msg: 'Connected to MongoDB',
        uri: this.getRedactedUri(MONGODB_URI),
        env: process.env.NODE_ENV,
      });

      this.retryCount = 0;
    } catch (error) {
      logger.error({
        msg: 'Failed to connect to MongoDB',
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: this.retryCount,
      });

      await this.handleConnectionError();
    }
  }

  /**
   * Disconnect from MongoDB database
   */
  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      logger.info('Disconnected from MongoDB');
    } catch (error) {
      logger.error({
        msg: 'Error disconnecting from MongoDB',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle connection errors with retry logic
   */
  private async handleConnectionError(): Promise<void> {
    if (isTest()) {
      throw new Error('Database connection failed in test environment');
    }

    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      logger.info({
        msg: 'Retrying database connection',
        retryCount: this.retryCount,
        maxRetries: this.maxRetries,
        delay: this.retryDelay,
      });

      await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      await this.connect();
    } else {
      logger.fatal('Maximum database connection retries exceeded');
      process.exit(1);
    }
  }

  /**
   * Setup database event listeners
   */
  setupEventListeners(): void {
    const db = mongoose.connection;

    db.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    db.on('error', error => {
      logger.error({
        msg: 'Mongoose connection error',
        error: error.message,
      });
    });

    db.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Get redacted database URI for logging
   */
  private getRedactedUri(uri: string): string {
    try {
      const url = new URL(uri);
      if (url.password) {
        url.password = '[REDACTED]';
      }
      return url.toString();
    } catch {
      return '[REDACTED]';
    }
  }

  /**
   * Check database connection health
   */
  async isHealthy(): Promise<boolean> {
    try {
      const state = mongoose.connection.readyState;
      return state === 1; // 1 = connected
    } catch {
      return false;
    }
  }

  /**
   * Get database connection status
   */
  getConnectionStatus(): string {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return states[mongoose.connection.readyState as keyof typeof states] || 'unknown';
  }
}

// Export singleton instance
const db = new DatabaseConnection();

// Export connection function for convenience
export const connectDatabase = async (): Promise<void> => {
  db.setupEventListeners();
  await db.connect();
};

export { db };
export default db;
