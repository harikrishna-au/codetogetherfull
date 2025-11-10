# Backend Design Document

## Overview

The CodeTogether backend is a Node.js/Express application with Socket.IO for real-time communication, using MongoDB as the local database. The system supports user authentication via Firebase, real-time collaborative coding sessions, matchmaking, and comprehensive admin management.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Admin Panel   │    │   Firebase      │
│   (React)       │    │   (React)       │    │   Auth          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ HTTP/Socket.IO        │ HTTP                  │ Auth
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Backend       │
                    │   (Node.js)     │
                    │   - Express     │
                    │   - Socket.IO   │
                    │   - JWT Auth    │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   MongoDB       │
                    │   (Local)       │
                    └─────────────────┘
```

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Real-time**: Socket.IO
- **Database**: MongoDB (local instance)
- **Authentication**: Firebase Admin SDK + JWT
- **Process Management**: PM2 (optional)
- **Development**: nodemon, TypeScript

## Components and Interfaces

### 1. Authentication Service

**Purpose**: Handle Firebase token validation and JWT session management

**Key Methods**:
- `validateFirebaseToken(idToken)` - Validates Firebase ID token
- `generateJWT(user)` - Creates JWT session token
- `verifyJWT(token)` - Validates JWT token
- `refreshToken(token)` - Refreshes expired tokens

**Interfaces**:
```typescript
interface AuthService {
  validateFirebaseToken(idToken: string): Promise<FirebaseUser>;
  generateJWT(user: FirebaseUser): string;
  verifyJWT(token: string): Promise<JWTPayload>;
  middleware: (req: Request, res: Response, next: NextFunction) => void;
}
```

### 2. Socket Manager

**Purpose**: Handle Socket.IO connections, authentication, and real-time events

**Key Features**:
- JWT-based socket authentication
- Room management for coding sessions
- Real-time code synchronization
- Chat message broadcasting
- Connection cleanup

**Socket Events**:
```typescript
// Client to Server
interface ClientEvents {
  join: (data: { roomId: string }) => void;
  joinQueue: (data: { type: string }) => void;
  rejoinQueue: (data: { type: string }) => void;
  chatMessage: (data: { roomId: string; message: string; sender: string }) => void;
  codeChange: (data: { roomId: string; code: string }) => void;
  fetchChatHistory: (data: { roomId: string }) => void;
}

// Server to Client
interface ServerEvents {
  matchFound: (data: { roomId: string; question: Question }) => void;
  queueRejoined: (data: { waiting: boolean; mode?: string; difficulty?: string }) => void;
  chatMessage: (data: { message: string; sender: string; timestamp: number }) => void;
  codeSync: (data: { code: string; userId: string }) => void;
  roomClosed: (data: { roomId: string; reason: string }) => void;
  'room-exit': (data: { roomId: string; leaver: string; reason: string }) => void;
}
```

### 3. Matchmaking Service

**Purpose**: Handle user queuing and matching logic

**Key Features**:
- Difficulty-based queue management
- User compatibility matching
- Queue timeout handling
- Match creation and room assignment

**Queue Structure**:
```typescript
interface QueueEntry {
  userId: string;
  socketId: string;
  difficulty: string;
  mode: string;
  joinedAt: Date;
  userInfo: {
    displayName: string;
    email: string;
  };
}

interface MatchmakingService {
  addToQueue(entry: QueueEntry): void;
  removeFromQueue(userId: string): void;
  findMatch(difficulty: string): QueueEntry[] | null;
  getQueueStats(): QueueStats;
  clearQueue(difficulty?: string): void;
}
```

### 4. Room Manager

**Purpose**: Manage coding session rooms and their lifecycle

**Key Features**:
- Room creation and initialization
- Session timer management
- Question assignment
- Room cleanup and termination

**Room Structure**:
```typescript
interface Room {
  id: string;
  participants: string[];
  question: Question;
  createdAt: Date;
  expiresAt: Date;
  status: 'active' | 'ended';
  sharedCode: string;
  chatHistory: ChatMessage[];
  difficulty: string;
  mode: string;
}

interface RoomManager {
  createRoom(users: QueueEntry[], question: Question): Room;
  joinRoom(roomId: string, userId: string): boolean;
  leaveRoom(roomId: string, userId: string): void;
  getRoomQuestion(roomId: string): Question | null;
  endRoom(roomId: string, reason: string): void;
  cleanupExpiredRooms(): void;
}
```

### 5. Question Service

**Purpose**: Manage coding questions and test cases

**Key Features**:
- Question CRUD operations
- Difficulty-based question selection
- Test case management
- Question statistics

**Question Structure**:
```typescript
interface Question {
  _id?: string;
  questionId: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  examples: Example[];
  constraints: string[];
  tags: string[];
  hints: string[];
  starterCode: {
    java: string;
    python: string;
    cpp: string;
    javascript: string;
  };
  compileTestCases: TestCase[];
  majorTestCases: TestCase[];
  createdAt: Date;
  updatedAt: Date;
}

interface QuestionService {
  addQuestion(question: Question): Promise<void>;
  getQuestionsByDifficulty(difficulty: string): Promise<Question[]>;
  getRandomQuestion(difficulty: string, excludeIds?: string[]): Promise<Question>;
  updateQuestion(questionId: string, updates: Partial<Question>): Promise<void>;
  deleteQuestion(questionId: string): Promise<void>;
  getQuestionStats(): Promise<QuestionStats>;
}
```

### 6. User State Manager

**Purpose**: Track user progress and session state

**Key Features**:
- User completion tracking
- Session state management
- Progress analytics
- Heartbeat monitoring

**User State Structure**:
```typescript
interface UserState {
  userId: string;
  state: 'idle' | 'waiting' | 'matched' | 'in-session';
  roomId?: string;
  mode?: string;
  difficulty?: string;
  completedQuestions: string[];
  sessionHistory: SessionRecord[];
  lastActive: Date;
  isActive: boolean;
}

interface UserStateManager {
  updateUserState(userId: string, updates: Partial<UserState>): Promise<void>;
  getUserState(userId: string): Promise<UserState>;
  markUserActive(userId: string): Promise<void>;
  markUserInactive(userId: string): Promise<void>;
  getActiveUsers(): Promise<UserState[]>;
  cleanupInactiveUsers(): Promise<void>;
}
```

## Data Models

### MongoDB Collections

#### 1. Users Collection
```javascript
{
  _id: ObjectId,
  userId: String, // Firebase UID
  email: String,
  displayName: String,
  createdAt: Date,
  lastLogin: Date,
  completedQuestions: [String], // Array of question IDs
  sessionHistory: [{
    roomId: String,
    questionId: String,
    completedAt: Date,
    duration: Number,
    partner: String
  }],
  preferences: {
    preferredDifficulty: String,
    preferredLanguage: String
  }
}
```

#### 2. Questions Collection
```javascript
{
  _id: ObjectId,
  questionId: String, // Unique identifier (q1, q2, etc.)
  title: String,
  description: String,
  difficulty: String, // 'Easy', 'Medium', 'Hard'
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  constraints: [String],
  tags: [String],
  hints: [String],
  starterCode: {
    java: String,
    python: String,
    cpp: String,
    javascript: String
  },
  compileTestCases: [{
    input: Mixed,
    output: String
  }],
  majorTestCases: [{
    input: Mixed,
    output: String
  }],
  createdAt: Date,
  updatedAt: Date,
  usageCount: Number,
  averageCompletionTime: Number
}
```

#### 3. Rooms Collection
```javascript
{
  _id: ObjectId,
  roomId: String, // UUID
  participants: [String], // Array of user IDs
  questionId: String,
  createdAt: Date,
  expiresAt: Date,
  status: String, // 'active', 'ended'
  sharedCode: String,
  chatHistory: [{
    userId: String,
    message: String,
    timestamp: Date
  }],
  difficulty: String,
  mode: String, // 'friendly', 'challenge'
  endedAt: Date,
  endReason: String
}
```

#### 4. UserStates Collection
```javascript
{
  _id: ObjectId,
  userId: String, // Firebase UID
  state: String, // 'idle', 'waiting', 'matched', 'in-session'
  roomId: String,
  mode: String,
  difficulty: String,
  lastActive: Date,
  isActive: Boolean,
  queueJoinedAt: Date,
  socketId: String
}
```

#### 5. Sessions Collection (for analytics)
```javascript
{
  _id: ObjectId,
  roomId: String,
  participants: [String],
  questionId: String,
  startedAt: Date,
  endedAt: Date,
  duration: Number,
  completed: Boolean,
  codeSubmissions: [{
    userId: String,
    code: String,
    timestamp: Date,
    testResults: Mixed
  }],
  chatMessageCount: Number,
  difficulty: String,
  mode: String
}
```

### Database Indexes

```javascript
// Users collection
db.users.createIndex({ "userId": 1 }, { unique: true });
db.users.createIndex({ "email": 1 });
db.users.createIndex({ "lastLogin": 1 });

// Questions collection
db.questions.createIndex({ "questionId": 1 }, { unique: true });
db.questions.createIndex({ "difficulty": 1 });
db.questions.createIndex({ "tags": 1 });
db.questions.createIndex({ "usageCount": 1 });

// Rooms collection
db.rooms.createIndex({ "roomId": 1 }, { unique: true });
db.rooms.createIndex({ "participants": 1 });
db.rooms.createIndex({ "status": 1 });
db.rooms.createIndex({ "expiresAt": 1 });

// UserStates collection
db.userStates.createIndex({ "userId": 1 }, { unique: true });
db.userStates.createIndex({ "state": 1 });
db.userStates.createIndex({ "isActive": 1 });
db.userStates.createIndex({ "lastActive": 1 });

// Sessions collection
db.sessions.createIndex({ "roomId": 1 });
db.sessions.createIndex({ "participants": 1 });
db.sessions.createIndex({ "startedAt": 1 });
db.sessions.createIndex({ "questionId": 1 });
```

## Error Handling

### Error Response Format
```typescript
interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
  timestamp: string;
}
```

### Error Categories
1. **Authentication Errors** (401)
   - Invalid Firebase token
   - Expired JWT token
   - Missing authentication

2. **Authorization Errors** (403)
   - Insufficient permissions
   - Admin-only endpoints

3. **Validation Errors** (400)
   - Invalid request data
   - Missing required fields
   - Invalid question format

4. **Not Found Errors** (404)
   - Room not found
   - Question not found
   - User not found

5. **Conflict Errors** (409)
   - User already in queue
   - Room already full
   - Duplicate question ID

6. **Server Errors** (500)
   - Database connection issues
   - Firebase service errors
   - Internal processing errors

## Testing Strategy

### Unit Tests
- Authentication service methods
- Question service CRUD operations
- Matchmaking logic
- Room management functions
- User state transitions

### Integration Tests
- API endpoint testing
- Socket.IO event handling
- Database operations
- Firebase integration
- JWT token flow

### End-to-End Tests
- Complete user authentication flow
- Matchmaking and room creation
- Real-time chat and code sync
- Session timeout handling
- Admin operations

### Performance Tests
- Concurrent user connections
- Database query performance
- Socket.IO message throughput
- Memory usage under load
- Response time benchmarks

## Security Considerations

### Authentication Security
- Firebase token validation on every request
- JWT token expiration and refresh
- Secure cookie settings for session tokens
- Rate limiting on authentication endpoints

### Socket.IO Security
- JWT-based socket authentication
- Room access validation
- Message sanitization
- Connection rate limiting

### Data Security
- Input validation and sanitization
- MongoDB injection prevention
- Sensitive data encryption
- Audit logging for admin actions

### API Security
- CORS configuration
- Request size limits
- Rate limiting per user
- Admin endpoint protection

## Performance Optimizations

### Database Optimizations
- Proper indexing strategy
- Connection pooling
- Query optimization
- Aggregation pipelines for analytics

### Caching Strategy
- In-memory caching for active rooms
- Question caching by difficulty
- User state caching
- Socket connection mapping

### Real-time Optimizations
- Efficient Socket.IO room management
- Message batching for high-frequency updates
- Connection cleanup and resource management
- Heartbeat optimization

### Scalability Considerations
- Horizontal scaling preparation
- Database sharding strategy
- Load balancing readiness
- Microservice architecture potential