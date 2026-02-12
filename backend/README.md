# CodeTogether Backend

A Node.js/Express backend server for the CodeTogether collaborative coding platform with real-time features using Socket.IO and MongoDB.

## Features

- 🔐 Authentication via Clerk (replaces Firebase)
- 🚀 Real-time collaboration with Socket.IO
- 🎯 Smart matchmaking system
- 📝 Question and test case management
- 👥 Room and session management
- 📊 Admin dashboard APIs
- 🗄️ MongoDB with optimized schemas
- 🛡️ Comprehensive error handling and logging

## Prerequisites

- Node.js 18+ 
- MongoDB (local instance)
- Firebase project with Admin SDK credentials

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB locally:**
   ```bash
   mongod
   ```

4. **Run in development mode:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Environment Configuration

Copy `.env.example` to `.env` and configure:

### Required Variables
- `MONGODB_URI` - MongoDB connection string
- `CLERK_SECRET_KEY` - Clerk Secret Key (from Clerk Dashboard)
- `CLERK_PUBLISHABLE_KEY` - Clerk Publishable Key

- `JWT_SECRET` - Secret key for JWT tokens (min 32 characters)

### Optional Variables
- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment (development/production/test)
- `CORS_ORIGIN` - Allowed origins for CORS
- `LOG_LEVEL` - Logging level (error/warn/info/debug)

## API Endpoints

### Authentication
- `POST /api/session/login` - Login with Firebase token
- `POST /api/session/logout` - Logout and invalidate session
- `GET /api/validate-session` - Validate current session

### User Management
- `GET /api/active-users` - Get active users count
- `POST /api/heartbeat` - Update user activity
- `POST /api/user-inactive` - Mark user as inactive

### Matchmaking
- `POST /api/matchmaking/cancel-queue` - Cancel queue request
- `GET /api/queue-count` - Get current queue statistics

### Session Management
- `POST /api/session/end-room` - End a coding session

### Admin APIs
- `GET /admin-api/admin/questions` - Get all questions
- `POST /admin-api/admin/add-question` - Add new question
- `DELETE /admin-api/admin/questions/:id` - Delete question
- `GET /admin-api/admin/next-question-id` - Get next question ID
- `POST /admin-api/admin/clear-queues` - Clear all queues
- `GET /admin-api/admin/queue/stats` - Get queue statistics

## Socket.IO Events

### Client to Server
- `join` - Join a coding room
- `joinQueue` - Join matchmaking queue
- `rejoinQueue` - Rejoin existing queue
- `chatMessage` - Send chat message
- `codeChange` - Sync code changes
- `fetchChatHistory` - Get room chat history
- `getRoomQuestion` - Get room's assigned question

### Server to Client
- `matchFound` - Match found, room created
- `queueRejoined` - Successfully rejoined queue
- `chatMessage` - New chat message received
- `codeSync` - Code synchronized from partner
- `roomClosed` - Room has been closed
- `room-exit` - User left the room

## Database Schema

### Collections
- **users** - User profiles and preferences
- **questions** - Coding questions and test cases
- **rooms** - Active coding sessions
- **userStates** - Current user states and activity
- **sessions** - Historical session data

### Indexes
Optimized indexes for:
- User lookups by Firebase UID
- Question filtering by difficulty
- Room management by participants
- User state tracking by activity

## Development

### Scripts
- `npm run dev` - Development with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues

### Project Structure
```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── models/          # MongoDB models
├── services/        # Business logic services
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── server.ts        # Main server file
```

## Logging

Structured logging with Winston:
- Console output in development
- File logging in production
- Error tracking with stack traces
- Request/response logging
- Performance monitoring

## Error Handling

Comprehensive error handling:
- Custom error classes for different scenarios
- Global error handler middleware
- Structured error responses
- Automatic error logging
- Graceful degradation

## Security

Security measures implemented:
- Firebase token validation
- JWT session management
- CORS configuration
- Rate limiting
- Input validation and sanitization
- Helmet.js security headers

## Performance

Optimizations included:
- MongoDB connection pooling
- Efficient database queries with indexes
- Socket.IO room management
- Memory usage optimization
- Response compression

## Monitoring

Health monitoring features:
- Health check endpoints
- Performance metrics
- Error rate tracking
- Active user monitoring
- Resource usage logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run linting and tests
6. Submit a pull request

## License

MIT License - see LICENSE file for details