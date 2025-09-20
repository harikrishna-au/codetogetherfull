import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import database connections
import { connectMongoDB, connectRedis, setupGracefulShutdown } from './config/database.js';

// Import route handlers
import sessionRoutes from './routes/session.js';
import questionRoutes from './routes/questions.js';
import queueRoutes from './routes/queue.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/users.js';

// Import socket handlers
import { setupSocketHandlers } from './socket/socketHandlers.js';

// Import services
import { DatabaseSessionManager } from './services/DatabaseSessionManager.js';
import { QueueManager } from './services/QueueManager.js';
import { DatabaseRoomManager } from './services/DatabaseRoomManager.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:8080",
      "http://localhost:8081", 
      "http://localhost:8082"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 4000;

// Initialize database connections and managers
let redisClient = null;
let sessionManager = null;
let queueManager = null;
let roomManager = null;

async function initializeServices() {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    
    // Connect to Redis (optional)
    redisClient = await connectRedis();
    
    // Initialize managers with database support
    sessionManager = new DatabaseSessionManager(redisClient);
    queueManager = new QueueManager();
    roomManager = new DatabaseRoomManager();
    
    // Make managers available to routes after initialization
    app.locals.sessionManager = sessionManager;
    app.locals.queueManager = queueManager;
    app.locals.roomManager = roomManager;
    app.locals.io = io;
    
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
}

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:8081", 
    "http://localhost:8082"
  ],
  credentials: true
}));

// Rate limiting - More permissive for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/session', sessionRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/users', userRoutes);
app.use('/admin-api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Active users endpoint
app.get('/api/active-users', async (req, res) => {
  try {
    const activeUsers = await sessionManager.getActiveUsers();
    res.json({ activeUsers });
  } catch (error) {
    console.error('Get active users error:', error);
    res.status(500).json({ error: 'Failed to get active users' });
  }
});

// Queue count endpoint
app.get('/api/queue-count', (req, res) => {
  try {
    const counts = queueManager.getQueueCounts();
    res.json(counts);
  } catch (error) {
    console.error('Get queue count error:', error);
    res.status(500).json({ error: 'Failed to get queue counts' });
  }
});

// Heartbeat endpoint
app.post('/api/heartbeat', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (sessionId) {
      await sessionManager.updateHeartbeat(sessionId);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ error: 'Failed to update heartbeat' });
  }
});

// User inactive endpoint
app.post('/api/user-inactive', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (sessionId) {
      await sessionManager.markUserInactive(sessionId);
      queueManager.removeFromAllQueues(sessionId);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('User inactive error:', error);
    res.status(500).json({ error: 'Failed to mark user inactive' });
  }
});

// Validate session endpoint
app.get('/api/validate-session', async (req, res) => {
  try {
    const { sessionId } = req.query;
    const isValid = await sessionManager.isValidSession(sessionId);
    res.json({ valid: isValid });
  } catch (error) {
    console.error('Validate session error:', error);
    res.status(500).json({ error: 'Failed to validate session' });
  }
});

// Socket.IO setup
setupSocketHandlers(io, { sessionManager, queueManager, roomManager });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Setup graceful shutdown
setupGracefulShutdown();

// Start server after initializing services
async function startServer() {
  await initializeServices();
  
  server.listen(PORT, () => {
    console.log(`🚀 CodeTogether Backend running on port ${PORT}`);
    console.log(`📡 Socket.IO server ready for connections`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️ MongoDB: Connected`);
    console.log(`⚡ Redis: ${redisClient ? 'Connected' : 'Not available (using fallback)'}`);
  });
}

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

export default app;
