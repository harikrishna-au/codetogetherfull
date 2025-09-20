import { v4 as uuidv4 } from 'uuid';
import Session from '../models/Session.js';
import User from '../models/User.js';

export class DatabaseSessionManager {
  constructor(redisClient = null) {
    this.redisClient = redisClient;
    
    // Cleanup inactive sessions every 5 minutes
    setInterval(() => this.cleanupInactiveSessions(), 5 * 60 * 1000);
  }

  async createSession(userId, userData = {}) {
    try {
      const sessionId = uuidv4();
      
      // Create or update user
      await User.findOneAndUpdate(
        { userId },
        { 
          userId,
          ...userData,
          isActive: true,
          lastActivity: new Date(),
          $inc: { 'stats.totalSessions': 1 }
        },
        { upsert: true, new: true }
      );

      // Create session
      const session = new Session({
        sessionId,
        userId,
        userData,
        state: 'na',
        isActive: true,
        lastActivity: new Date()
      });

      await session.save();

      // Cache in Redis if available
      if (this.redisClient) {
        await this.redisClient.setEx(
          `session:${sessionId}`, 
          3600, // 1 hour TTL
          JSON.stringify(session.toObject())
        );
      }

      console.log(`Session created: ${sessionId} for user: ${userId}`);
      return session.toObject();
    } catch (error) {
      console.error('Create session error:', error);
      throw error;
    }
  }

  async getSession(sessionId) {
    try {
      // Try Redis first
      if (this.redisClient) {
        const cached = await this.redisClient.get(`session:${sessionId}`);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Fallback to MongoDB
      const session = await Session.findOne({ sessionId, isActive: true });
      
      // Cache in Redis if found
      if (session && this.redisClient) {
        await this.redisClient.setEx(
          `session:${sessionId}`, 
          3600,
          JSON.stringify(session.toObject())
        );
      }

      return session ? session.toObject() : null;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  async getSessionByUserId(userId) {
    try {
      const session = await Session.findOne({ userId, isActive: true }).sort({ createdAt: -1 });
      return session ? session.toObject() : null;
    } catch (error) {
      console.error('Get session by user ID error:', error);
      return null;
    }
  }

  async updateSession(sessionId, updates) {
    try {
      const session = await Session.findOneAndUpdate(
        { sessionId, isActive: true },
        { 
          ...updates, 
          lastActivity: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (session) {
        // Update Redis cache
        if (this.redisClient) {
          await this.redisClient.setEx(
            `session:${sessionId}`, 
            3600,
            JSON.stringify(session.toObject())
          );
        }
        return session.toObject();
      }
      return null;
    } catch (error) {
      console.error('Update session error:', error);
      return null;
    }
  }

  async updateHeartbeat(sessionId) {
    try {
      const session = await Session.findOneAndUpdate(
        { sessionId, isActive: true },
        { lastActivity: new Date() },
        { new: true }
      );

      if (session) {
        // Update Redis cache
        if (this.redisClient) {
          await this.redisClient.setEx(
            `session:${sessionId}`, 
            3600,
            JSON.stringify(session.toObject())
          );
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update heartbeat error:', error);
      return false;
    }
  }

  async markUserInactive(sessionId) {
    try {
      const session = await Session.findOneAndUpdate(
        { sessionId },
        { 
          isActive: false, 
          state: 'na',
          updatedAt: new Date()
        },
        { new: true }
      );

      if (session) {
        // Remove from Redis cache
        if (this.redisClient) {
          await this.redisClient.del(`session:${sessionId}`);
        }
        console.log(`User marked inactive: ${sessionId}`);
      }
    } catch (error) {
      console.error('Mark user inactive error:', error);
    }
  }

  async destroySession(sessionId) {
    try {
      const session = await Session.findOneAndDelete({ sessionId });
      
      if (session) {
        // Remove from Redis cache
        if (this.redisClient) {
          await this.redisClient.del(`session:${sessionId}`);
        }
        console.log(`Session destroyed: ${sessionId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Destroy session error:', error);
      return false;
    }
  }

  async isValidSession(sessionId) {
    try {
      const session = await this.getSession(sessionId);
      return session && session.isActive;
    } catch (error) {
      console.error('Validate session error:', error);
      return false;
    }
  }

  async getActiveUsers() {
    try {
      const sessions = await Session.find({ isActive: true }).lean();
      return sessions.map(session => ({
        sessionId: session.sessionId,
        userId: session.userId,
        state: session.state,
        roomId: session.roomId,
        lastActivity: session.lastActivity
      }));
    } catch (error) {
      console.error('Get active users error:', error);
      return [];
    }
  }

  async getUserState(sessionId) {
    try {
      const session = await this.getSession(sessionId);
      return session ? {
        state: session.state,
        roomId: session.roomId,
        isActive: session.isActive,
        lastActivity: session.lastActivity
      } : null;
    } catch (error) {
      console.error('Get user state error:', error);
      return null;
    }
  }

  async setUserState(sessionId, state, additionalData = {}) {
    try {
      const session = await Session.findOneAndUpdate(
        { sessionId, isActive: true },
        { 
          state,
          ...additionalData,
          lastActivity: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (session) {
        // Update Redis cache
        if (this.redisClient) {
          await this.redisClient.setEx(
            `session:${sessionId}`, 
            3600,
            JSON.stringify(session.toObject())
          );
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Set user state error:', error);
      return false;
    }
  }

  async cleanupInactiveSessions() {
    try {
      const inactiveThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
      
      const result = await Session.updateMany(
        { 
          lastActivity: { $lt: inactiveThreshold },
          isActive: true
        },
        { 
          isActive: false,
          state: 'na',
          updatedAt: new Date()
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`Cleaned up ${result.modifiedCount} inactive sessions`);
      }
    } catch (error) {
      console.error('Cleanup inactive sessions error:', error);
    }
  }

  async getSessionStats() {
    try {
      const total = await Session.countDocuments({});
      const active = await Session.countDocuments({ isActive: true });
      
      const byState = await Session.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$state', count: { $sum: 1 } } }
      ]);

      const stateStats = {};
      byState.forEach(item => {
        stateStats[item._id] = item.count;
      });

      return { total, active, byState: stateStats };
    } catch (error) {
      console.error('Get session stats error:', error);
      return { total: 0, active: 0, byState: {} };
    }
  }
}
