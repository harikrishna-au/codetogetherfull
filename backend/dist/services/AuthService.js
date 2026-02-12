import { env } from '@/config/env.js';
import { User } from '@/models/User.js';
import { UserState } from '@/models/UserState.js';
import { logger } from '@/utils/logger.js';
import { AuthenticationError, ValidationError } from '@/utils/errors.js';
import { createClerkClient } from '@clerk/clerk-sdk-node';
const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
export class AuthService {
    static async validateSession(userId) {
        try {
            if (!userId) {
                throw new ValidationError('User ID is required');
            }
            let dbUser = await User.findOne({ userId: userId });
            let userEmail = '';
            let userDisplayName = '';
            if (!dbUser) {
                const clerkUser = await clerkClient.users.getUser(userId);
                userEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || '';
                userDisplayName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || userEmail;
                dbUser = new User({
                    userId: userId,
                    email: userEmail,
                    displayName: userDisplayName,
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
                logger.info('New user synced from Clerk', {
                    userId,
                    email: userEmail,
                });
                const userState = new UserState({
                    userId: userId,
                    state: 'idle',
                    lastActive: new Date(),
                    isActive: true,
                });
                await userState.save();
            }
            else {
                dbUser.lastLogin = new Date();
                await dbUser.save();
                let userState = await UserState.findOne({ userId: userId });
                if (!userState) {
                    userState = new UserState({
                        userId,
                        state: 'idle',
                        lastActive: new Date(),
                        isActive: true,
                    });
                }
                else {
                    userState.isActive = true;
                    userState.lastActive = new Date();
                }
                await userState.save();
                userEmail = dbUser.email;
                userDisplayName = dbUser.displayName || '';
            }
            const user = {
                userId,
                email: userEmail,
                displayName: userDisplayName,
            };
            return {
                user,
                dbUser,
            };
        }
        catch (error) {
            logger.error('Session validation failed:', error);
            throw error;
        }
    }
    static async logoutUser(userId) {
        try {
            const userState = await UserState.findOne({ userId: userId });
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
        }
        catch (error) {
            logger.error('User logout failed:', error);
            throw error;
        }
    }
    static async getUserProfile(userId) {
        try {
            const dbUser = await User.findOne({ userId: userId });
            if (!dbUser) {
                throw new AuthenticationError('User not found');
            }
            const userState = await UserState.findOne({ userId: userId });
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
        }
        catch (error) {
            logger.error('Failed to get user profile:', error);
            throw error;
        }
    }
    static async updateUserPreferences(userId, preferences) {
        try {
            const dbUser = await User.findOne({ userId: userId });
            if (!dbUser) {
                throw new AuthenticationError('User not found');
            }
            dbUser.preferences = { ...dbUser.preferences, ...preferences };
            await dbUser.save();
            logger.info('User preferences updated', { userId, preferences });
        }
        catch (error) {
            logger.error('Failed to update user preferences:', error);
            throw error;
        }
    }
}
//# sourceMappingURL=AuthService.js.map