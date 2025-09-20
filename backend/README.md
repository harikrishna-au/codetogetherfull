# CodeTogether Arena Backend

A Node.js/Express backend server with Socket.IO for real-time collaborative coding sessions.

## Features

- **Session Management**: User authentication and session handling
- **Real-time Collaboration**: Socket.IO for live code editing and chat
- **Matchmaking System**: Queue-based user matching by difficulty
- **Room Management**: Collaborative coding rooms with state management
- **Question Management**: CRUD operations for coding problems
- **Admin Panel APIs**: Administrative endpoints for managing the platform

## Tech Stack

- **Node.js** with ES6 modules
- **Express.js** for REST API
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **In-memory storage** (easily replaceable with database)

## Quick Start

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Start production server:**
   ```bash
   npm start
   ```

The server will run on `http://localhost:4000` by default.

## API Endpoints

### Session Management
- `POST /api/session/login` - Create/get user session
- `POST /api/session/logout` - End user session
- `GET /api/session/:sessionId` - Get session info
- `POST /api/session/end-room` - End current room
- `POST /api/session/cancel-queue` - Cancel matchmaking

### Questions
- `GET /api/questions` - Get all questions
- `GET /api/questions/:questionId` - Get specific question
- `GET /api/questions/random/:difficulty` - Get random question by difficulty
- `POST /api/questions` - Add new question
- `PUT /api/questions/:questionId` - Update question
- `DELETE /api/questions/:questionId` - Delete question

### Queue Management
- `POST /api/queue/join` - Join matchmaking queue
- `POST /api/queue/leave` - Leave queue
- `GET /api/queue/position/:sessionId` - Get queue position
- `GET /api/queue/stats` - Get queue statistics

### User Management
- `GET /api/users/:sessionId/state` - Get user state
- `PATCH /api/users/:sessionId/state` - Update user state
- `GET /api/users` - Get all active users (admin)
- `POST /api/users/reset` - Reset all user states (admin)

### Admin APIs
- `GET /admin-api/admin/questions` - Admin question management
- `GET /admin-api/admin/queue/stats` - Queue statistics
- `POST /admin-api/admin/clear-queues` - Clear all queues
- `GET /admin-api/admin/rooms` - Get active rooms
- `POST /admin-api/admin/rooms/:roomId/terminate` - Terminate room

### Utility Endpoints
- `GET /api/health` - Health check
- `GET /api/active-users` - Get active users count
- `GET /api/queue-count` - Get queue counts
- `POST /api/heartbeat` - Update user heartbeat
- `GET /api/validate-session` - Validate session

## Socket.IO Events

### Client → Server
- `joinQueue` - Join matchmaking queue
- `leaveQueue` - Leave queue
- `join` - Join a room
- `codeChange` - Send code changes
- `languageChange` - Change programming language
- `chatMessage` - Send chat message
- `fetchChatHistory` - Get chat history
- `testResults` - Send test results
- `leaveRoom` - Leave current room
- `heartbeat` - Send heartbeat

### Server → Client
- `queueJoined` - Queue join confirmation
- `matchFound` - Match found notification
- `queueCounts` - Updated queue counts
- `userJoined` - User joined room
- `userLeft` - User left room
- `sessionReady` - All users ready
- `codeChange` - Code updated by peer
- `languageChange` - Language changed by peer
- `chatMessage` - New chat message
- `testResults` - Test results from peer
- `queueError` - Queue operation error
- `error` - General error

## Architecture

### Core Services

1. **SessionManager** - Handles user sessions and states
2. **QueueManager** - Manages matchmaking queues
3. **RoomManager** - Handles collaborative coding rooms

### State Management

- **User States**: `na`, `waiting`, `matched`, `in-session`
- **Room States**: `waiting`, `active`, `completed`, `terminated`
- **Queue Management**: FIFO matching with position tracking

### Security Features

- JWT-based authentication
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation

## Environment Variables

```env
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-secret-key
```

## Development

### Project Structure
```
backend/
├── src/
│   ├── routes/          # API route handlers
│   ├── services/        # Core business logic
│   ├── socket/          # Socket.IO handlers
│   └── server.js        # Main server file
├── package.json
├── .env.example
└── README.md
```

### Adding Database Support

The current implementation uses in-memory storage. To add database support:

1. Install your preferred database driver (MongoDB, PostgreSQL, etc.)
2. Create database models/schemas
3. Replace in-memory operations in services
4. Add database connection configuration

### Scaling Considerations

For production deployment:

1. **Database**: Replace in-memory storage with persistent database
2. **Redis**: Add Redis for session storage and pub/sub
3. **Load Balancing**: Use sticky sessions for Socket.IO
4. **Monitoring**: Add logging and monitoring tools
5. **Security**: Implement proper authentication and authorization

## Testing

```bash
npm test
```

## License

MIT License
