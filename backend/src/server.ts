import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env, corsConfig, rateLimitConfig } from '@/config/env.js';
import { connectDatabase, checkDatabaseHealth, initializeIndexes } from '@/config/database.js';
import { initializeFirebase } from '@/config/firebase.js';
import { logger, requestLogger } from '@/utils/logger.js';
import { globalErrorHandler } from '@/utils/errors.js';

// Import routes
import authRoutes from '@/routes/auth.js';
import userRoutes from '@/routes/users.js';
import sessionRoutes from '@/routes/session.js';

// Import services
import { SocketService } from '@/services/SocketService.js';
import { UserState } from '@/models/UserState.js';

// Create Express app
const app = express();
const server = createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: corsConfig,
  transports: ['websocket'],
});

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors(corsConfig));

// Rate limiting
app.use(rateLimit(rateLimitConfig));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', async (_req, res) => {
  const dbHealth = await checkDatabaseHealth();
  
  res.json({
    status: dbHealth ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    database: dbHealth ? 'connected' : 'disconnected',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/session', sessionRoutes);

// Basic API routes
app.get('/api/status', (_req, res) => {
  res.json({
    success: true,
    message: 'CodeTogether Backend API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Active users endpoint (public)
app.get('/api/active-users', async (_req, res) => {
  try {
    const activeUsers = await UserState.find({ isActive: true });
    res.json({
      success: true,
      activeUsers: activeUsers.map((user: any) => ({
        userId: user.userId,
        lastActive: user.lastActive,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active users',
    });
  }
});

// Initialize Socket.IO service
let socketService: SocketService;

// Global error handler
app.use(globalErrorHandler);

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize Firebase (optional)
    initializeFirebase();
    
    // Connect to database
    await connectDatabase();
    
    // Initialize database indexes
    await initializeIndexes();
    
    // Initialize Socket.IO service
    socketService = new SocketService(io);
    
    // Start server
    const PORT = env.PORT || 4000;
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`, {
        environment: env.NODE_ENV,
        port: PORT,
      });
      logger.info('✅ Socket.IO service initialized');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

export { app, server, io };