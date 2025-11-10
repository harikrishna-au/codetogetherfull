import { Response } from 'express';
import { AuthService } from '@/services/AuthService.js';
import { logger } from '@/utils/logger.js';
import { asyncHandler, ValidationError } from '@/utils/errors.js';
import type { AuthenticatedRequest } from '@/types/index.js';

export class AuthController {
  // Login with Firebase token
  static login = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { idToken } = req.body;

    if (!idToken) {
      throw new ValidationError('Firebase ID token is required');
    }

    const result = await AuthService.loginUser(idToken);

    // Set session cookie
    res.cookie('sessionToken', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    logger.info('User logged in successfully', {
      userId: result.user.uid,
      email: result.user.email,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          userId: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          emailVerified: result.user.emailVerified,
        },
        token: result.sessionToken,
      },
    });
  });

  // Logout
  static logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (userId) {
      await AuthService.logoutUser(userId);
    }

    // Clear session cookie
    res.clearCookie('sessionToken');

    logger.info('User logged out successfully', { userId });

    res.json({
      success: true,
      message: 'Logout successful',
    });
  });

  // Refresh token
  static refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { token } = req.body;

    if (!token) {
      throw new ValidationError('Token is required');
    }

    const newToken = await AuthService.refreshToken(token);

    // Set new session cookie
    res.cookie('sessionToken', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
      },
    });
  });

  // Get current user profile
  static getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const profile = await AuthService.getUserProfile(userId);

    res.json({
      success: true,
      data: profile,
    });
  });

  // Update user preferences
  static updatePreferences = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { preferences } = req.body;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (!preferences) {
      throw new ValidationError('Preferences are required');
    }

    await AuthService.updateUserPreferences(userId, preferences);

    logger.info('User preferences updated', { userId, preferences });

    res.json({
      success: true,
      message: 'Preferences updated successfully',
    });
  });

  // Validate current session
  static validateSession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // If we reach here, the authentication middleware has already validated the session
    const user = req.user;
    const dbUser = req.dbUser;

    res.json({
      success: true,
      message: 'Session is valid',
      data: {
        user: {
          userId: user?.userId,
          email: user?.email,
          displayName: user?.displayName,
        },
        isActive: dbUser?.isActive || false,
        lastLogin: dbUser?.lastLogin,
      },
    });
  });

  // Get user statistics
  static getUserStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Get user stats from database
    const stats = await AuthService.getUserProfile(userId);

    res.json({
      success: true,
      data: {
        totalQuestionsCompleted: stats.stats.totalQuestionsCompleted,
        totalSessions: stats.stats.totalSessions,
        completedQuestions: stats.user.completedQuestions,
        preferences: stats.user.preferences,
        memberSince: stats.user.createdAt,
        lastActive: stats.state?.lastActive,
      },
    });
  });
}