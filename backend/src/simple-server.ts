// Simple working backend without complex types for now
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/code-together-arena')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Code Together Arena Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Simple login endpoint for testing
app.post('/api/session/login', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // For now, just return a simple response
    res.status(200).json({
      success: true,
      message: 'Login endpoint is working',
      sessionToken: 'temp-session-token',
      user: {
        id: '123',
        name: 'Test User',
        email: 'test@example.com'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Default route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Code Together Arena Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      login: '/api/session/login'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
