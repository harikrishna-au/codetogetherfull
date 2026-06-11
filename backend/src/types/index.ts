import { Request } from 'express';
import { Socket } from 'socket.io';

// User types
// User types


export interface JWTPayload {
  userId: string;
  email: string;
  displayName?: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  dbUser?: any;
}

export interface AuthenticatedSocket extends Socket {
  user?: JWTPayload;
  dbUser?: any;
}

// Question types
export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface TestCase {
  input: any;
  output: string;
  explanation?: string;
}

export interface Question {
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
  usageCount?: number;
  averageCompletionTime?: number;
}

// Room and session types
export interface ChatMessage {
  userId: string;
  message: string;
  timestamp: Date;
  sender?: string;
}

export interface Room {
  _id?: string;
  roomId: string;
  participants: string[];
  questionId: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'active' | 'ended';
  sharedCode: string;
  chatHistory: ChatMessage[];
  difficulty: string;
  mode: string;
  endedAt?: Date;
  endReason?: string;
}

export interface SessionRecord {
  roomId: string;
  questionId: string;
  completedAt: Date;
  duration: number;
  partner: string;
}

// User state types
export interface UserState {
  _id?: string;
  userId: string;
  state: 'idle' | 'waiting' | 'matched' | 'in-session';
  roomId?: string;
  mode?: string;
  difficulty?: string;
  lastActive: Date;
  isActive: boolean;
  queueJoinedAt?: Date;
  socketId?: string;
  // Instance methods
  joinRoom?: (roomId: string) => Promise<any>;
  joinQueue?: (mode: string, difficulty: string) => Promise<any>;
  leaveQueue?: () => Promise<any>;
  leaveRoom?: () => Promise<any>;
}

export interface User {
  _id?: string;
  userId: string;
  email: string;
  displayName?: string;
  createdAt: Date;
  lastLogin: Date;
  completedQuestions: string[];
  sessionHistory: SessionRecord[];
  preferences: {
    preferredDifficulty?: string;
    preferredLanguage?: string;
  };
}

// Queue types
export interface QueueEntry {
  userId: string;
  socketId: string;
  difficulty: string;
  mode: string;
  joinedAt: Date;
  userInfo: {
    displayName?: string;
    email: string;
  };
}

export interface QueueStats {
  [difficulty: string]: {
    count: number;
    averageWaitTime: number;
    oldestWaitTime: number;
  };
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
  timestamp: string;
}

// Elo rating change attached to roundWinner for challenge matches (B1)
export interface RatingChangeInfo {
  userId: string;
  oldRating: number;
  newRating: number;
  delta: number;
}

export interface RoundWinnerRatings {
  winner: RatingChangeInfo;
  loser: RatingChangeInfo;
}

// Socket event types
export interface ClientToServerEvents {
  join: (data: { roomId: string }, callback?: (response: any) => void) => void;
  joinQueue: (data: { type: string; difficulty?: string }) => void;
  rejoinQueue: (data: { type: string }) => void;
  leaveQueue: () => void;
  chatMessage: (data: { roomId: string; message: string; sender: string }) => void;
  codeChange: (data: { roomId: string; code: string }) => void;
  fetchChatHistory: (data: { roomId: string }, callback?: (response: any) => void) => void;
  getRoomQuestion: (data: { roomId: string }, callback?: (response: any) => void) => void;
  submissionResult: (data: { roomId: string; userId?: string; passed: number; total: number }) => void;
  // NOTE: `submissionWin` was removed (A3) — wins are decided server-side from /api/execute.
  syncCode: (data: { roomId: string; code: string }) => void;
  // Yjs collaborative editing
  'yjs:sync-request': (data: { roomId: string }) => void;
  'yjs:update': (data: { roomId: string; update: string }) => void;
  'yjs:awareness': (data: { roomId: string; update: string }) => void;
  languageChange: (data: { roomId: string; language: string; template: string }) => void;
  'webrtc-signal': (data: { roomId: string; from: string; signal: any }) => void;
}

export interface ServerToClientEvents {
  matchFound: (data: { roomId: string; mode?: string; difficulty?: string; question?: Question; rejoin?: boolean }) => void;
  matchError: (data: { message: string }) => void;
  requestTimerSync: (data: { roomId: string }) => void;
  queueRejoined: (data: { waiting: boolean; mode?: string; difficulty?: string }) => void;
  queueJoined: (data: { type: string; timestamp: number }) => void;
  chatMessage: (data: { message: string; sender: string; timestamp: number }) => void;
  codeSync: (data: { code: string; userId: string }) => void;
  roomClosed: (data: { roomId: string; reason: string }) => void;
  'room-exit': (data: { roomId: string; leaver: string; reason: string }) => void;
  userJoined: (data: { userId: string; timestamp: number }) => void;
  submissionResult: (data: { userId: string; passed: number; total: number; timestamp: number }) => void;
  roundWinner: (data: { winnerId: string; passed: number; total: number; runtime: number; language: string; reason?: 'submission' | 'forfeit' | 'timer'; ratings?: RoundWinnerRatings; timestamp: number }) => void;
  // Forfeit grace flow (A4)
  opponentDisconnected: (data: { roomId: string; userId: string; graceMs: number; deadline: number }) => void;
  opponentReconnected: (data: { roomId: string; userId: string }) => void;
  // Rating-based matchmaking status (B3)
  queueStatus: (data: { position: number; waitSeconds: number; queueSize: number; ratingWindow: number }) => void;
  codeSynced: (data: { initiatorId: string; code: string }) => void;
  // Yjs collaborative editing
  'yjs:sync-response': (data: { state: string }) => void;
  'yjs:update': (data: { update: string }) => void;
  'yjs:awareness': (data: { update: string }) => void;
  languageChange: (data: { language: string; template: string }) => void;
  'webrtc-signal': (data: { from: string; signal: any }) => void;
}

// Statistics types
export interface QuestionStats {
  totalQuestions: number;
  questionsByDifficulty: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
  mostUsedQuestions: Array<{
    questionId: string;
    title: string;
    usageCount: number;
  }>;
  averageCompletionTimes: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
}

export interface SystemStats {
  activeUsers: number;
  totalUsers: number;
  activeRooms: number;
  queueLength: number;
  totalQuestions: number;
  sessionsToday: number;
}