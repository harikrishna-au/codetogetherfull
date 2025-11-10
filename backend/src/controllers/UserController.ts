import { Response } from 'express';
import { UserState } from '@/models/UserState.js';
import { logger } from '@/utils/logger.js';
import { asyncHandler, ValidationError } from '@/utils/errors.js';
import type { AuthenticatedRequest } from '@/types/index.js';

export class UserController {
  // Update user heartbeat
  static heartbeat = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Update user activity
    let userState = await UserState.findOne({ userId });

    if (!userState) {
      userState = new UserState({
        userId,
        state: 'idle',
        lastActive: new Date(),
        isActive: true,
      });
    } else {
      userState.lastActive = new Date();
      userState.isActive = true;
    }

    await userState.save();

    logger.debug('User heartbeat updated', { userId });

    res.json({
      success: true,
      message: 'Heartbeat updated',
      data: {
        lastActive: userState.lastActive,
        isActive: userState.isActive,
        state: userState.state,
      },
    });
  });

  // Mark user as inactive
  static markInactive = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const userState = await UserState.findOne({ userId });
    if (userState) {
      userState.isActive = false;
      await userState.save();
    }

    logger.info('User marked as inactive', { userId });

    res.json({
      success: true,
      message: 'User marked as inactive',
    });
  });

  // Get active users count
  static getActiveUsers = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const activeUsers = await UserState.find({ isActive: true });

    const userList = activeUsers.map((user: any) => ({
      userId: user.userId,
      state: user.state,
      lastActive: user.lastActive,
      roomId: user.roomId,
    }));

    res.json({
      success: true,
      data: {
        count: activeUsers.length,
        activeUsers: userList,
      },
    });
  });

  // Get user state
  static getUserState = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const userState = await UserState.findOne({ userId });

    if (!userState) {
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
        isActive: userState.isActive,
        lastActive: userState.lastActive,
        roomId: userState.roomId,
        mode: userState.mode,
        difficulty: userState.difficulty,
        queueJoinedAt: userState.queueJoinedAt,
      },
    });
  });

  // Update user state
  static updateUserState = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const { state, roomId, mode, difficulty } = req.body;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (!state) {
      throw new ValidationError('State is required');
    }

    let userState = await UserState.findOne({ userId });

    if (!userState) {
      userState = new UserState({
        userId,
        state,
        lastActive: new Date(),
        isActive: true,
        roomId,
        mode,
        difficulty,
      });
    } else {
      userState.state = state;
      userState.lastActive = new Date();
      if (roomId !== undefined) userState.roomId = roomId;
      if (mode !== undefined) userState.mode = mode;
      if (difficulty !== undefined) userState.difficulty = difficulty;
    }

    await userState.save();

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
        roomId: userState.roomId,
        mode: userState.mode,
        difficulty: userState.difficulty,
      },
    });
  });

  // Get queue statistics
  static getQueueStats = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    // Simple queue stats using aggregation
    const stats = await UserState.aggregate([
      { $match: { state: 'waiting' } },
      {
        $group: {
          _id: { difficulty: '$difficulty', mode: '$mode' },
          count: { $sum: 1 },
          avgWaitTime: { $avg: { $subtract: [new Date(), '$queueJoinedAt'] } },
          oldestWaitTime: { $min: '$queueJoinedAt' },
        },
      },
    ]);

    const formattedStats: any = {};

    stats.forEach((stat: any) => {
      const key = `${stat._id.difficulty}-${stat._id.mode}`;
      formattedStats[key] = {
        count: stat.count,
        averageWaitTime: Math.round((stat.avgWaitTime || 0) / 1000), // Convert to seconds
        oldestWaitTime: Math.round((new Date().getTime() - new Date(stat.oldestWaitTime).getTime()) / 1000), // Convert to seconds
      };
    });

    res.json({
      success: true,
      data: formattedStats,
    });
  });

  // Clean up inactive users
  static cleanupInactiveUsers = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const timeoutMs = 30 * 60 * 1000; // 30 minutes
    const cutoffTime = new Date(Date.now() - timeoutMs);
    
    const result = await UserState.updateMany(
      {
        lastActive: { $lt: cutoffTime },
        isActive: true,
      },
      {
        $set: {
          isActive: false,
          state: 'idle',
          roomId: undefined,
          mode: undefined,
          difficulty: undefined,
          queueJoinedAt: undefined,
          socketId: undefined,
        },
      }
    );
    
    const cleanedCount = result.modifiedCount;

    logger.info('Inactive users cleaned up', { cleanedCount });

    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} inactive users`,
      data: {
        cleanedCount,
      },
    });
  });
}