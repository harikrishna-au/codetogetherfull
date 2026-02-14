import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env, corsConfig, rateLimitConfig } from '@/config/env.js';
import { supabase } from '@/config/supabase.js';
import { logger, requestLogger } from '@/utils/logger.js';
import { globalErrorHandler } from '@/utils/errors.js';

// Import routes
import authRoutes from '@/routes/auth.js';
import userRoutes from '@/routes/users.js';
import sessionRoutes from '@/routes/session.js';
import questionsRouter from '@/routes/questions.js';
import testCasesRouter from '@/routes/testcases.js';
import queueRouter from '@/routes/queue.js';
import roomsRouter from '@/routes/rooms.js';
import executeRouter from '@/routes/execute.js';

// Import services
import { SocketService } from '@/services/SocketService.js';

// Create Express app
const app = express();
const server = createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: corsConfig,
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000,
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
  // Check Supabase connection
  const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });

  res.json({
    status: !error ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    database: !error ? 'connected' : 'disconnected',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/questions', questionsRouter);
app.use('/api/testcases', testCasesRouter);
app.use('/api/queue', queueRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/execute', executeRouter);

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
    const { data: activeUsers, error } = await supabase
      .from('user_states')
      .select('user_id, last_active')
      .eq('is_active', true);

    if (error) throw error;

    res.json({
      success: true,
      activeUsers: activeUsers.map((user: any) => ({
        userId: user.user_id,
        lastActive: user.last_active,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active users',
    });
  }
});

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
    // Initialize Socket.IO service (owns matchmaking internally)
    new SocketService(io);

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
  const msg = reason instanceof Error ? reason.stack : String(reason);
  console.error('[UNHANDLED REJECTION]', msg);
  logger.error('Unhandled Rejection', { reason: msg });
  // Don't exit — log and continue so the server stays up
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT EXCEPTION]', error.stack || error.message);
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  // Don't exit on non-fatal errors
});

export { app, server, io };