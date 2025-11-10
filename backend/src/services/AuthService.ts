import jwt from 'jsonwebtoken';
import { env } from '@/config/env.js';
import { verifyFirebaseToken, getFirebaseUser } from '@/config/firebase.js';
import { User } from '@/models/User.js';
import { UserState } from '@/models/UserState.js';
import { logger } from '@/utils/logger.js';
import { AuthenticationError, ValidationError } from '@/utils/errors.js';
import type { FirebaseUser, JWTPayload } from '@/types/index.js';

export class AuthService {
  // Validate Firebase ID token and return user info
  static async validateFirebaseToken(idToken: string): Promise<FirebaseUser> {
    try {
      if (!idToken) {
        throw new ValidationError('ID token is required');
      }

      const decodedToken = await verifyFirebaseToken(idToken);
      
      return {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        displayName: decodedToken.name,
        emailVerified: decodedToken.email_verified || false,
      };
    } catch (error) {
      logger.error('Firebase token validation failed:', error);
      throw new AuthenticationError('Invalid Firebase token');
    }
  }

  // Generate JWT session token
  static generateJWT(user: FirebaseUser): string {
    try {
      const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName,
      };

      const token = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
        issuer: 'codetogether-backend',
        audience: 'codetogether-frontend',
      });

      logger.debug('JWT token generated successfully', {
        userId: user.uid,
        email: user.email,
      });

      return token;
    } catch (error) {
      logger.error('JWT token generation failed:', error);
      throw new AuthenticationError('Failed to generate session token');
    }
  }

  // Verify JWT token
  static async verifyJWT(token: string): Promise<JWTPayload> {
    try {
      if (!token) {
        throw new ValidationError('Token is required');
      }

      const decoded = jwt.verify(token, env.JWT_SECRET, {
        issuer: 'codetogether-backend',
        audience: 'codetogether-frontend',
      }) as JWTPayload;

      logger.debug('JWT token verified successfully', {
        userId: decoded.userId,
        email: decoded.email,
      });

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token expired');
      }
      logger.error('JWT token verification failed:', error);
      throw new AuthenticationError('Token verification failed');
    }
  }

  // Refresh JWT token
  static async refreshToken(oldToken: string): Promise<string> {
    try {
      // Verify the old token (even if expired, we can still decode it)
      const decoded = jwt.decode(oldToken) as JWTPayload;
      
      if (!decoded || !decoded.userId) {
        throw new AuthenticationError('Invalid token format');
      }

      // Get fresh user data from Firebase
      const firebaseUser = await getFirebaseUser(decoded.userId);
      
      const refreshedUser: FirebaseUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName,
        emailVerified: firebaseUser.emailVerified,
      };

      // Generate new token
      return this.generateJWT(refreshedUser);
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw new AuthenticationError('Failed to refresh token');
    }
  }

  // Login user with Firebase token
  static async loginUser(idToken: string): Promise<{ user: FirebaseUser; sessionToken: string; dbUser: any }> {
    try {
      // Validate Firebase token
      const firebaseUser = await this.validateFirebaseToken(idToken);
      
      // Generate session token
      const sessionToken = this.generateJWT(firebaseUser);
      
      // Create or update user in database
      let dbUser = await User.findByUserId(firebaseUser.uid);
      
      if (!dbUser) {
        // Create new user
        dbUser = new User({
          userId: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          createdAt: new Date(),
          lastLogin: new Date(),
          completedQuestions: [],
          sessionHistory: [],
          preferences: {
            preferredDifficulty: 'Easy',
            preferredLanguage: 'javascript',
          },
        });
        
        await dbUser.save();
        logger.info('New user created', {
          userId: firebaseUser.uid,
          email: firebaseUser.email,
        });
      } else {
        // Update last login
        await dbUser.updateLastLogin();
        logger.info('User login updated', {
          userId: firebaseUser.uid,
          email: firebaseUser.email,
        });
      }

      // Create or update user state
      let userState = await UserState.findByUserId(firebaseUser.uid);
      
      if (!userState) {
        userState = new UserState({
          userId: firebaseUser.uid,
          state: 'idle',
          lastActive: new Date(),
          isActive: true,
        });
      } else {
        userState.lastActive = new Date();
        userState.isActive = true;
      }
      
      await userState.save();

      return {
        user: firebaseUser,
        sessionToken,
        dbUser,
      };
    } catch (error) {
      logger.error('User login failed:', error);
      throw error;
    }
  }

  // Logout user
  static async logoutUser(userId: string): Promise<void> {
    try {
      // Update user state to inactive
      const userState = await UserState.findByUserId(userId);
      if (userState) {
        userState.isActive = false;
        userState.state = 'idle';
        userState.socketId = undefined;
        userState.roomId = undefined;
        userState.mode = undefined;
        userState.difficulty = undefined;
        userState.queueJoinedAt = undefined;
        await userState.save();
      }

      logger.info('User logged out successfully', { userId });
    } catch (error) {
      logger.error('User logout failed:', error);
      throw error;
    }
  }

  // Get user profile
  static async getUserProfile(userId: string): Promise<any> {
    try {
      const dbUser = await User.findByUserId(userId);
      if (!dbUser) {
        throw new AuthenticationError('User not found');
      }

      const userState = await UserState.findByUserId(userId);

      return {
        user: {
          userId: dbUser.userId,
          email: dbUser.email,
          displayName: dbUser.displayName,
          createdAt: dbUser.createdAt,
          lastLogin: dbUser.lastLogin,
          completedQuestions: dbUser.completedQuestions,
          preferences: dbUser.preferences,
        },
        state: userState ? {
          state: userState.state,
          isActive: userState.isActive,
          lastActive: userState.lastActive,
          roomId: userState.roomId,
        } : null,
        stats: {
          totalQuestionsCompleted: dbUser.completedQuestions.length,
          totalSessions: dbUser.sessionHistory.length,
        },
      };
    } catch (error) {
      logger.error('Failed to get user profile:', error);
      throw error;
    }
  }

  // Update user preferences
  static async updateUserPreferences(userId: string, preferences: any): Promise<void> {
    try {
      const dbUser = await User.findByUserId(userId);
      if (!dbUser) {
        throw new AuthenticationError('User not found');
      }

      dbUser.preferences = { ...dbUser.preferences, ...preferences };
      await dbUser.save();

      logger.info('User preferences updated', { userId, preferences });
    } catch (error) {
      logger.error('Failed to update user preferences:', error);
      throw error;
    }
  }

  // Validate session and return user info
  static async validateSession(token: string): Promise<{ user: JWTPayload; dbUser: any }> {
    try {
      const decoded = await this.verifyJWT(token);
      
      // Check if user still exists in database
      const dbUser = await User.findByUserId(decoded.userId);
      if (!dbUser) {
        throw new AuthenticationError('User not found');
      }

      // Update user activity
      const userState = await UserState.findByUserId(decoded.userId);
      if (userState) {
        await userState.updateActivity();
      }

      return {
        user: decoded,
        dbUser,
      };
    } catch (error) {
      logger.error('Session validation failed:', error);
      throw error;
    }
  }
}