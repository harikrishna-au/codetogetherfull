import { supabase } from '@/config/supabase.js';
import { logger } from '@/utils/logger.js';
import { asyncHandler, ValidationError } from '@/utils/errors.js';
export class UserController {
    // Update user heartbeat
    static heartbeat = asyncHandler(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ValidationError('User ID is required');
        }
        // Update user activity
        // Upsert user state
        const { data: userState, error } = await supabase
            .from('user_states')
            .upsert({
            user_id: userId,
            state: 'idle', // Default state, preserving existing logic would require fetch first but upsert is safer for heartbeat
            last_active: new Date().toISOString(),
            is_active: true,
        }, { onConflict: 'user_id' })
            .select()
            .single();
        if (error) {
            logger.error('Error updating heartbeat:', error);
            throw new Error('Failed to update heartbeat');
        }
        logger.debug('User heartbeat updated', { userId });
        res.json({
            success: true,
            message: 'Heartbeat updated',
            data: {
                lastActive: userState.last_active,
                isActive: userState.is_active,
                state: userState.state,
            },
        });
    });
    // Mark user as inactive
    static markInactive = asyncHandler(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ValidationError('User ID is required');
        }
        const { error } = await supabase
            .from('user_states')
            .update({ is_active: false })
            .eq('user_id', userId);
        if (error) {
            logger.error('Error marking user inactive:', error);
        }
        logger.info('User marked as inactive', { userId });
        res.json({
            success: true,
            message: 'User marked as inactive',
        });
    });
    // Get active users count
    static getActiveUsers = asyncHandler(async (_req, res) => {
        const { data: activeUsers, error } = await supabase
            .from('user_states')
            .select('*')
            .eq('is_active', true);
        if (error) {
            logger.error('Error fetching active users:', error);
            throw new Error('Failed to fetch active users');
        }
        const userList = (activeUsers || []).map((user) => ({
            userId: user.user_id,
            state: user.state,
            lastActive: user.last_active,
            roomId: user.room_id,
        }));
        res.json({
            success: true,
            data: {
                count: userList.length,
                activeUsers: userList,
            },
        });
    });
    // Get user state
    static getUserState = asyncHandler(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new ValidationError('User ID is required');
        }
        const { data: userState, error } = await supabase
            .from('user_states')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (!userState || error) {
            res.json({
                success: true,
                data: {
                    state: 'idle',
                    isActive: false,
                    lastActive: null,
                },
            });
            return;
        }
        res.json({
            success: true,
            data: {
                state: userState.state,
                isActive: userState.is_active,
                lastActive: userState.last_active,
                roomId: userState.room_id,
                mode: userState.mode,
                difficulty: userState.difficulty,
                queueJoinedAt: userState.queue_joined_at,
            },
        });
    });
    // Update user state
    static updateUserState = asyncHandler(async (req, res) => {
        const userId = req.user?.userId;
        const { state, roomId, mode, difficulty } = req.body;
        if (!userId) {
            throw new ValidationError('User ID is required');
        }
        if (!state) {
            throw new ValidationError('State is required');
        }
        // Prepare update object
        const updateData = {
            state,
            last_active: new Date().toISOString(),
            is_active: true,
        };
        if (roomId !== undefined)
            updateData.room_id = roomId;
        if (mode !== undefined)
            updateData.mode = mode;
        if (difficulty !== undefined)
            updateData.difficulty = difficulty;
        const { data: userState, error } = await supabase
            .from('user_states')
            .upsert({
            user_id: userId,
            ...updateData
        }, { onConflict: 'user_id' })
            .select()
            .single();
        if (error) {
            logger.error('Error updating user state:', error);
            throw new Error('Failed to update user state');
        }
        logger.info('User state updated', {
            userId,
            state,
            roomId,
            mode,
            difficulty,
        });
        res.json({
            success: true,
            message: 'User state updated',
            data: {
                state: userState.state,
                roomId: userState.room_id,
                mode: userState.mode,
                difficulty: userState.difficulty,
            },
        });
    });
    // Get queue statistics
    static getQueueStats = asyncHandler(async (_req, res) => {
        // Supabase aggregation is limited, so we fetch waiting users and process in-memory for now
        // For large scale, we would use a Database Function (RPC)
        const { data: waitingUsers, error } = await supabase
            .from('user_states')
            .select('mode, difficulty, queue_joined_at')
            .eq('state', 'waiting');
        if (error) {
            logger.error('Error fetching queue stats:', error);
            throw new Error('Failed to fetch queue stats');
        }
        const formattedStats = {};
        const statsMap = new Map();
        (waitingUsers || []).forEach((user) => {
            const key = `${user.difficulty}-${user.mode}`;
            const currentStats = statsMap.get(key) || { count: 0, totalWait: 0, oldest: Number.MAX_SAFE_INTEGER };
            const joinedAt = new Date(user.queue_joined_at).getTime();
            const now = Date.now();
            const waitTime = now - joinedAt;
            currentStats.count++;
            currentStats.totalWait += waitTime;
            if (joinedAt < currentStats.oldest)
                currentStats.oldest = joinedAt;
            statsMap.set(key, currentStats);
        });
        statsMap.forEach((val, key) => {
            formattedStats[key] = {
                count: val.count,
                averageWaitTime: Math.round((val.totalWait / val.count) / 1000),
                oldestWaitTime: Math.round((Date.now() - val.oldest) / 1000)
            };
        });
        res.json({
            success: true,
            data: formattedStats,
        });
    });
    // Clean up inactive users
    static cleanupInactiveUsers = asyncHandler(async (_req, res) => {
        const timeoutMs = 30 * 60 * 1000; // 30 minutes
        const cutoffTime = new Date(Date.now() - timeoutMs).toISOString();
        const { data, error } = await supabase
            .from('user_states')
            .update({
            is_active: false,
            state: 'idle',
            room_id: null,
            mode: null,
            difficulty: null,
            queue_joined_at: null,
            socket_id: null
        })
            .lt('last_active', cutoffTime)
            .eq('is_active', true)
            .select();
        // Note: count might not be returned depending on supabase setup/headers, but update works.
        if (error) {
            logger.error('Error cleaning inactive users:', error);
        }
        logger.info('Inactive users cleaned up');
        res.json({
            success: true,
            message: `Cleaned up inactive users`,
            data: {
                cleanedCount: data?.length || 0,
            },
        });
    });
}
