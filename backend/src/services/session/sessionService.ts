import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../models/User';
import { Session } from '../../models/Session';
import { Session as ISession, User as IUser } from '../../types/auth';

class SessionService {
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  async createSession(userId: string): Promise<{ sessionToken: string; expiresAt: Date }> {
    try {
      // Expire any existing sessions for this user
      await Session.expireUserSessions(userId);

      // Generate session token
      const sessionToken = uuidv4();
      
      // Calculate expiration time (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Create new session
      const session = new Session({
        userId,
        sessionToken,
        expiresAt,
        isActive: true,
        createdAt: new Date(),
        lastHeartbeat: new Date()
      });

      await session.save();

      return { sessionToken, expiresAt };
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  async validateSession(sessionToken: string): Promise<IUser | null> {
    try {
      const session = await Session.findByToken(sessionToken);
      if (!session) {
        return null;
      }

      // Update heartbeat
      await session.updateHeartbeat();

      // Find and return user
      const user = await User.findById(session.userId);
      return user;
    } catch (error) {
      console.error('Error validating session:', error);
      return null;
    }
  }

  async updateHeartbeat(sessionToken: string, userId: string): Promise<boolean> {
    try {
      const session = await Session.findByToken(sessionToken);
      if (!session || session.userId !== userId) {
        return false;
      }

      // Update session heartbeat
      await session.updateHeartbeat();

      // Update user activity
      const user = await User.findById(userId);
      if (user) {
        await user.updateActivity();
      }

      return true;
    } catch (error) {
      console.error('Error updating heartbeat:', error);
      return false;
    }
  }

  async expireSession(sessionToken: string): Promise<boolean> {
    try {
      const session = await Session.findByToken(sessionToken);
      if (!session) {
        return false;
      }

      // Expire session
      await session.expire();

      // Set user as inactive
      const user = await User.findById(session.userId);
      if (user) {
        await user.setInactive();
      }

      return true;
    } catch (error) {
      console.error('Error expiring session:', error);
      return false;
    }
  }

  async getUserSession(userId: string): Promise<ISession | null> {
    try {
      return await Session.findActiveByUserId(userId);
    } catch (error) {
      console.error('Error getting user session:', error);
      return null;
    }
  }

  async cleanExpiredSessions(): Promise<void> {
    try {
      await Session.cleanExpiredSessions();
      console.log('Expired sessions cleaned');
    } catch (error) {
      console.error('Error cleaning expired sessions:', error);
    }
  }

  generateJWT(payload: object): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: '24h' });
  }

  verifyJWT(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      return null;
    }
  }
}

export const sessionService = new SessionService();
export default sessionService;
