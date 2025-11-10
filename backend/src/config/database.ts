import mongoose from 'mongoose';
import { dbConfig } from './env.js';
import { logger } from '@/utils/logger.js';

// MongoDB connection state
let isConnected = false;

// Connect to MongoDB
export const connectDatabase = async (): Promise<void> => {
  if (isConnected) {
    logger.info('Database already connected');
    return;
  }

  try {
    // Set mongoose options
    mongoose.set('strictQuery', false);

    // Connect to MongoDB
    await mongoose.connect(dbConfig.uri, dbConfig.options);

    isConnected = true;
    logger.info('✅ MongoDB connected successfully', {
      uri: dbConfig.uri.replace(/\/\/.*@/, '//***:***@'), // Hide credentials in logs
      database: mongoose.connection.db?.databaseName,
    });

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    isConnected = false;
    throw error;
  }
};

// Disconnect from MongoDB
export const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

// Get connection status
export const getDatabaseStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
  };
};

// Initialize database indexes
export const initializeIndexes = async (): Promise<void> => {
  try {
    logger.info('Initializing database indexes...');

    // Get all models and ensure indexes
    const models = mongoose.models;
    const indexPromises = Object.values(models).map(async (model: any) => {
      try {
        await model.ensureIndexes();
        logger.debug(`Indexes ensured for ${model.modelName}`);
      } catch (error) {
        logger.error(`Failed to ensure indexes for ${model.modelName}:`, error);
      }
    });

    await Promise.all(indexPromises);
    logger.info('✅ Database indexes initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database indexes:', error);
    throw error;
  }
};

// Health check for database
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    if (!isConnected) {
      return false;
    }

    // Ping the database
    await mongoose.connection.db?.admin().ping();
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};