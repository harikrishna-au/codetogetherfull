import { v4 as uuidv4 } from 'uuid';

export class SessionManager {
  constructor() {
    this.sessions = new Map(); // sessionId -> session data
    this.userSessions = new Map(); // userId -> sessionId
    this.heartbeats = new Map(); // sessionId -> timestamp
    
    // Cleanup inactive sessions every 5 minutes
    setInterval(() => this.cleanupInactiveSessions(), 5 * 60 * 1000);
  }

  createSession(userId, userData = {}) {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      userId,
      userData,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
      roomId: null,
      state: 'na' // na, waiting, matched, in-session
    };

    this.sessions.set(sessionId, session);
    this.userSessions.set(userId, sessionId);
    this.heartbeats.set(sessionId, Date.now());

    console.log(`Session created: ${sessionId} for user: ${userId}`);
    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  getSessionByUserId(userId) {
    const sessionId = this.userSessions.get(userId);
    return sessionId ? this.sessions.get(sessionId) : null;
  }

  updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates, { lastActivity: new Date() });
      this.heartbeats.set(sessionId, Date.now());
      return session;
    }
    return null;
  }

  updateHeartbeat(sessionId) {
    if (this.sessions.has(sessionId)) {
      this.heartbeats.set(sessionId, Date.now());
      const session = this.sessions.get(sessionId);
      session.lastActivity = new Date();
      return true;
    }
    return false;
  }

  markUserInactive(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      session.state = 'na';
      console.log(`User marked inactive: ${sessionId}`);
    }
  }

  destroySession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.userSessions.delete(session.userId);
      this.sessions.delete(sessionId);
      this.heartbeats.delete(sessionId);
      console.log(`Session destroyed: ${sessionId}`);
      return true;
    }
    return false;
  }

  isValidSession(sessionId) {
    const session = this.sessions.get(sessionId);
    return session && session.isActive;
  }

  getActiveUsers() {
    const activeUsers = [];
    for (const [sessionId, session] of this.sessions) {
      if (session.isActive) {
        activeUsers.push({
          sessionId,
          userId: session.userId,
          state: session.state,
          roomId: session.roomId,
          lastActivity: session.lastActivity
        });
      }
    }
    return activeUsers;
  }

  getUserState(sessionId) {
    const session = this.sessions.get(sessionId);
    return session ? {
      state: session.state,
      roomId: session.roomId,
      isActive: session.isActive,
      lastActivity: session.lastActivity
    } : null;
  }

  setUserState(sessionId, state, additionalData = {}) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.state = state;
      Object.assign(session, additionalData);
      session.lastActivity = new Date();
      return true;
    }
    return false;
  }

  cleanupInactiveSessions() {
    const now = Date.now();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [sessionId, lastHeartbeat] of this.heartbeats) {
      if (now - lastHeartbeat > inactiveThreshold) {
        console.log(`Cleaning up inactive session: ${sessionId}`);
        this.destroySession(sessionId);
      }
    }
  }

  getSessionStats() {
    const total = this.sessions.size;
    const active = Array.from(this.sessions.values()).filter(s => s.isActive).length;
    const byState = {};
    
    for (const session of this.sessions.values()) {
      if (session.isActive) {
        byState[session.state] = (byState[session.state] || 0) + 1;
      }
    }

    return { total, active, byState };
  }
}
