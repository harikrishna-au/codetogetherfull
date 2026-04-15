import mongoose from 'mongoose';
import { dbConfig } from './env.js';
import { logger } from '../utils/logger.js';
let isConnected = false;
export const connectDatabase = async () => {
    if (isConnected) {
        logger.info('Database already connected');
        return;
    }
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(dbConfig.uri, dbConfig.options);
        isConnected = true;
        logger.info('✅ MongoDB connected successfully', {
            uri: dbConfig.uri.replace(/\/\/.*@/, '//***:***@'),
            database: mongoose.connection.db?.databaseName,
        });
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
    }
    catch (error) {
        logger.error('Failed to connect to MongoDB:', error);
        isConnected = false;
        throw error;
    }
};
export const disconnectDatabase = async () => {
    if (!isConnected) {
        return;
    }
    try {
        await mongoose.disconnect();
        isConnected = false;
        logger.info('MongoDB disconnected successfully');
    }
    catch (error) {
        logger.error('Error disconnecting from MongoDB:', error);
        throw error;
    }
};
export const getDatabaseStatus = () => {
    return {
        isConnected,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
    };
};
export const initializeIndexes = async () => {
    try {
        logger.info('Initializing database indexes...');
        const models = mongoose.models;
        const indexPromises = Object.values(models).map(async (model) => {
            try {
                await model.ensureIndexes();
                logger.debug(`Indexes ensured for ${model.modelName}`);
            }
            catch (error) {
                logger.error(`Failed to ensure indexes for ${model.modelName}:`, error);
            }
        });
        await Promise.all(indexPromises);
        logger.info('✅ Database indexes initialized successfully');
    }
    catch (error) {
        logger.error('Failed to initialize database indexes:', error);
        throw error;
    }
};
export const checkDatabaseHealth = async () => {
    try {
        if (!isConnected) {
            return false;
        }
        await mongoose.connection.db?.admin().ping();
        return true;
    }
    catch (error) {
        logger.error('Database health check failed:', error);
        return false;
    }
};
//# sourceMappingURL=database.js.map