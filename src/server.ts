/**
 * Server entry point for InvoLuck Backend
 * Starts the Express application and connects to database
 */

import { app } from './app';
import { PORT, NODE_ENV } from './config/env';
import { connectDatabase } from './config/db';
import { verifyMailConfig } from './config/mail';
import { handleAsyncError, handleUncaughtException } from './middlewares/error';
import logger from './config/logger';

// Handle uncaught exceptions
process.on('uncaughtException', handleUncaughtException);

// Handle unhandled promise rejections
process.on('unhandledRejection', handleAsyncError);

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connection established');

    // Verify email configuration
    const isEmailConfigValid = await verifyMailConfig();
    if (!isEmailConfigValid) {
      logger.warn('Email configuration verification failed - emails may not work');
    }

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info({
        msg: 'Server started successfully',
        port: PORT,
        environment: NODE_ENV,
        url: `http://localhost:${PORT}`,
        apiUrl: `http://localhost:${PORT}/api/v1`,
        timestamp: new Date().toISOString(),
      });
    });

    // Graceful shutdown handlers
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.fatal({
      msg: 'Server startup failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  logger.fatal({
    msg: 'Failed to start server',
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

export default app;
