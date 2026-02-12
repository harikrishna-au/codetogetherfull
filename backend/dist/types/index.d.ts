import { Request } from 'express';
import { Socket } from 'socket.io';
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
export interface ClientToServerEvents {
    join: (data: {
        roomId: string;
    }, callback?: (response: any) => void) => void;
    joinQueue: (data: {
        type: string;
    }) => void;
    rejoinQueue: (data: {
        type: string;
    }) => void;
    chatMessage: (data: {
        roomId: string;
        message: string;
        sender: string;
    }) => void;
    codeChange: (data: {
        roomId: string;
        code: string;
    }) => void;
    fetchChatHistory: (data: {
        roomId: string;
    }, callback?: (response: any) => void) => void;
    getRoomQuestion: (data: {
        roomId: string;
    }, callback?: (response: any) => void) => void;
}
export interface ServerToClientEvents {
    matchFound: (data: {
        roomId: string;
        question?: Question;
    }) => void;
    queueRejoined: (data: {
        waiting: boolean;
        mode?: string;
        difficulty?: string;
    }) => void;
    queueJoined: (data: {
        type: string;
        timestamp: number;
    }) => void;
    chatMessage: (data: {
        message: string;
        sender: string;
        timestamp: number;
    }) => void;
    codeSync: (data: {
        code: string;
        userId: string;
    }) => void;
    roomClosed: (data: {
        roomId: string;
        reason: string;
    }) => void;
    'room-exit': (data: {
        roomId: string;
        leaver: string;
        reason: string;
    }) => void;
    userJoined: (data: {
        userId: string;
        timestamp: number;
    }) => void;
}
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
//# sourceMappingURL=index.d.ts.map