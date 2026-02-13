import { AuthService } from '@/services/AuthService.js';
import { logger } from '@/utils/logger.js';
import { asyncHandler, ValidationError } from '@/utils/errors.js';
export class AuthController {
    // Methods handled by Clerk: login, logout, refreshToken are no longer needed
    // Get current user profile
    static getProfile = asyncHandler(async (req, res) => {
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
    static updatePreferences = asyncHandler(async (req, res) => {
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
    static validateSession = asyncHandler(async (req, res) => {
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
    static getUserStats = asyncHandler(async (req, res) => {
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
