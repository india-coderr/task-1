const mongoose = require('mongoose');

let isConnecting = false;

/**
 * Connect to MongoDB using Mongoose with resilient connection pooling.
 */
const connectDB = async (retries = 5, delay = 2000) => {
  // If already connected, return existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  // If currently in the process of connecting, don't initiate a parallel connect
  if (mongoose.connection.readyState === 2 || isConnecting) {
    return mongoose.connection;
  }

  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_pos';

  isConnecting = true;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 15000,
        maxPoolSize: 10,
        minPoolSize: 1,
        retryWrites: true,
        w: 'majority'
      });

      console.log(`[Database] MongoDB connected: ${conn.connection.host} / ${conn.connection.name}`);
      isConnecting = false;
      return conn;
    } catch (error) {
      console.error(`[Database Error] (Attempt ${attempt}/${retries}) Failed to connect: ${error.message}`);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delay));
      } else {
        isConnecting = false;
        if (uri.includes('cluster0')) {
          console.error(
            '[Database Tip] If connection fails, ensure your current IP address is whitelisted in MongoDB Atlas (Network Access > Allow from Anywhere or add current IP).'
          );
        }
        throw error;
      }
    }
  }
  isConnecting = false;
};

mongoose.connection.on('error', (err) => {
  console.error('[Database Runtime Error]', err.message);
});

module.exports = connectDB;
