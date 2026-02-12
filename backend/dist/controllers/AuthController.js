import { AuthService } from '@/services/AuthService.js';
import { logger } from '@/utils/logger.js';
import { asyncHandler, ValidationError } from '@/utils/errors.js';
export class AuthController {
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
    static validateSession = asyncHandler(async (req, res) => {
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
    static getUserStats = asyncHandler(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ValidationError('User ID is required');
        }
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
//# sourceMappingURL=AuthController.js.map