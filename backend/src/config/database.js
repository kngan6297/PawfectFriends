import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import config from './index.js';

const connectDB = async () => {
  try {
    // Check if MongoDB URI is available
    if (!config.mongoUri) {
      logger.warn(
        '⚠️ MongoDB URI not configured. Using in-memory database for development.'
      );
      // For development, we can continue without MongoDB
      return;
    }

    // Set mongoose options for better connection handling
    const mongooseOptions = {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
    };

    logger.info(`🔌 Attempting to connect to MongoDB at: ${config.mongoUri}`);

    const conn = await mongoose.connect(config.mongoUri, mongooseOptions);

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Set up connection event handlers
    mongoose.connection.on('connected', () => {
      logger.info('✅ MongoDB connection established successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('🔄 MongoDB reconnected');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('✅ MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        logger.error('❌ Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });
  } catch (error) {
    logger.error('❌ Error connecting to MongoDB:', error);

    // In development, don't exit the process if MongoDB is not available
    if (process.env.NODE_ENV === 'development') {
      logger.warn('⚠️ Continuing without MongoDB in development mode.');
      logger.warn('⚠️ Some features may not work without a database.');
      logger.warn(
        '⚠️ To fix this, ensure MongoDB is running or set MONGODB_URI in your .env file'
      );
      return;
    }

    // In production, exit if we can't connect to MongoDB
    logger.error(
      '❌ Cannot start application without MongoDB in production mode'
    );
    process.exit(1);
  }
};

export default connectDB;
