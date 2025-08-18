import mongoose from 'mongoose';
import { EventEmitter } from 'events';
import emailService from '../services/email/emailService.js';
import { config } from './environment.js';

// database events emitter
export const dbEvents = new EventEmitter();

let isConnected = false;
let connectionAttempts = 0;
let retryTimeoutId = null;
let previousDbStatus = null;

export function getConnectionStatus() {
  return {
    status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || 'unknown',
    attempts: connectionAttempts
  };
}

export async function connectDB() {
  try {
    const mongoUri = config.mongoUri;
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    connectionAttempts = 0;
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    isConnected = false;
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

export function retryConnection() {
  const maxAttempts = 10;
  const baseDelay = 1000;

  async function attemptConnection() {
    if (connectionAttempts >= maxAttempts) {
      console.error(`❌ Max connection attempts reached (${maxAttempts})`);
      dbEvents.emit('disconnected', {
        attempts: connectionAttempts,
        error: 'Max connection attempts reached',
        timestamp: new Date().toISOString()
      });
      return;
    }

    connectionAttempts++;

    try {
      await connectDB();
      dbEvents.emit('connected', { attempts: connectionAttempts });
    } catch (error) {
      if (connectionAttempts >= maxAttempts) {
        console.error(`❌ Max connection attempts reached (${maxAttempts})`);
        dbEvents.emit('disconnected', {
          attempts: connectionAttempts,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const delay = Math.min(baseDelay * Math.pow(2, connectionAttempts - 1), 20000);
      console.log(`🔄 Retrying connection in ${delay}ms... (attempt ${connectionAttempts}/${maxAttempts})`);
      retryTimeoutId = setTimeout(attemptConnection, delay);
    }
  }

  attemptConnection();
}


// setup database connection and event handlers
export function setupDatabase() {
  retryConnection();

  // database event handlers
  dbEvents.on("disconnected", async ({ attempts, error, timestamp }) => {
    console.log("📧 Sending DB error email after retries failed...");

    const dbInfo = getConnectionStatus();

    if (previousDbStatus !== "disconnected") {
      await emailService.sendDatabaseErrorEmail(error, {
        ...dbInfo,
        attempts,
        failedAt: timestamp,
      });
    }

    previousDbStatus = "disconnected";
  });

  dbEvents.on("connected", async ({ attempts }) => {
    if (previousDbStatus === "disconnected") {
      await emailService.sendRecoveryEmail({
        message: `Database connection restored after ${attempts || 0} attempts`,
        service: "Database",
        timestamp: new Date().toISOString(),
      });
    }

    previousDbStatus = "connected";
  });

  // mongoose connection events
  mongoose.connection.on('disconnected', () => {
    console.log('⚠️  MongoDB disconnected');
    isConnected = false;

    if (!retryTimeoutId) {
      retryConnection();
    }
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err);
    isConnected = false;
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
    isConnected = true;
    connectionAttempts = 0;

    if (retryTimeoutId) {
      clearTimeout(retryTimeoutId);
      retryTimeoutId = null;
    }
  });
}

export function cleanup() {
  if (retryTimeoutId) {
    clearTimeout(retryTimeoutId);
    retryTimeoutId = null;
  }

  return mongoose.connection.close();
}

export function isDbConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}