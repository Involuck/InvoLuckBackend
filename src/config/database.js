import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // if there is a cached connection, use it
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // if the connection is bad, clear the cache
  if (cached.conn && mongoose.connection.readyState !== 1) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      maxPoolSize: 10, // maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // close sockets after 45 seconds of inactivity
      family: 4 // use IPv4, skip trying IPv6
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts)
      .then((mongoose) => {
        console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
        return mongoose;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection failed:", err.message);
        cached.promise = null; // Reset promise on failure
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    console.error("❌ MongoDB connection failed:", err.message);
    throw err;
  }

  return cached.conn;
};

// check if the database is connected
export const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

// check the connection status
export const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  return {
    status: states[mongoose.connection.readyState] || 'unknown',
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name
  };
};

// event listeners
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
  cached.conn = null;
  cached.promise = null;
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
  cached.conn = null;
});

export default connectDB;