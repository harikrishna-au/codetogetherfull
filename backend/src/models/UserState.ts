import mongoose, { Schema } from 'mongoose';
import { UserState as IUserState } from '@/types/index.js';

// User state schema
const userStateSchema = new Schema<IUserState>({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  state: {
    type: String,
    required: true,
    enum: ['idle', 'waiting', 'matched', 'in-session'],
    default: 'idle',
    index: true,
  },
  roomId: {
    type: String,
    index: true,
  },
  mode: {
    type: String,
    enum: ['friendly', 'challenge'],
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
  },
  lastActive: {
    type: Date,
    default: Date.now,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  queueJoinedAt: {
    type: Date,
  },
  socketId: {
    type: String,
    index: true,
  },
}, {
  timestamps: true,
  collection: 'userStates',
});

// Indexes
userStateSchema.index({ userId: 1 }, { unique: true });
userStateSchema.index({ state: 1 });
userStateSchema.index({ isActive: 1 });
userStateSchema.index({ lastActive: -1 });
userStateSchema.index({ socketId: 1 });
userStateSchema.index({ state: 1, difficulty: 1 });
userStateSchema.index({ state: 1, mode: 1 });

// Instance methods
userStateSchema.methods.updateActivity = function() {
  this.lastActive = new Date();
  this.isActive = true;
  return this.save();
};

userStateSchema.methods.markInactive = function() {
  this.isActive = false;
  return this.save();
};

userStateSchema.methods.setState = function(state: string, additionalData?: any) {
  this.state = state;
  this.lastActive = new Date();
  
  if (additionalData) {
    Object.assign(this, additionalData);
  }
  
  // Clear queue-specific data when not waiting
  if (state !== 'waiting') {
    this.queueJoinedAt = undefined;
  }
  
  // Clear room-specific data when not in session
  if (state !== 'in-session' && state !== 'matched') {
    this.roomId = undefined;
  }
  
  return this.save();
};

userStateSchema.methods.joinQueue = function(mode: string, difficulty: string) {
  this.state = 'waiting';
  this.mode = mode;
  this.difficulty = difficulty;
  this.queueJoinedAt = new Date();
  this.lastActive = new Date();
  return this.save();
};

userStateSchema.methods.leaveQueue = function() {
  this.state = 'idle';
  this.mode = undefined;
  this.difficulty = undefined;
  this.queueJoinedAt = undefined;
  this.lastActive = new Date();
  return this.save();
};

userStateSchema.methods.joinRoom = function(roomId: string) {
  this.state = 'in-session';
  this.roomId = roomId;
  this.queueJoinedAt = undefined;
  this.lastActive = new Date();
  return this.save();
};

userStateSchema.methods.leaveRoom = function() {
  this.state = 'idle';
  this.roomId = undefined;
  this.lastActive = new Date();
  return this.save();
};

userStateSchema.methods.isInactive = function(timeoutMs: number) {
  const now = new Date();
  const timeSinceActive = now.getTime() - this.lastActive.getTime();
  return timeSinceActive > timeoutMs;
};

// Static methods
userStateSchema.statics.findByUserId = function(userId: string) {
  return this.findOne({ userId });
};

userStateSchema.statics.findBySocketId = function(socketId: string) {
  return this.findOne({ socketId });
};

userStateSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

userStateSchema.statics.findUsersInQueue = function(difficulty?: string, mode?: string) {
  const query: any = { state: 'waiting' };
  if (difficulty) query.difficulty = difficulty;
  if (mode) query.mode = mode;
  
  return this.find(query).sort({ queueJoinedAt: 1 });
};

userStateSchema.statics.findUsersInRoom = function(roomId: string) {
  return this.find({ roomId, state: 'in-session' });
};

userStateSchema.statics.getQueueStats = function() {
  return this.aggregate([
    { $match: { state: 'waiting' } },
    {
      $group: {
        _id: { difficulty: '$difficulty', mode: '$mode' },
        count: { $sum: 1 },
        oldestWaitTime: { $min: '$queueJoinedAt' },
        avgWaitTime: { $avg: { $subtract: [new Date(), '$queueJoinedAt'] } },
      },
    },
    {
      $project: {
        difficulty: '$_id.difficulty',
        mode: '$_id.mode',
        count: 1,
        oldestWaitTime: { $subtract: [new Date(), '$oldestWaitTime'] },
        avgWaitTime: 1,
        _id: 0,
      },
    },
  ]);
};

userStateSchema.statics.cleanupInactiveUsers = async function(timeoutMs: number) {
  const cutoffTime = new Date(Date.now() - timeoutMs);
  
  const result = await this.updateMany(
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
  
  return result.modifiedCount;
};

userStateSchema.statics.getUserStateStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$state',
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: '$count' },
        byState: {
          $push: {
            state: '$_id',
            count: '$count',
          },
        },
        activeUsers: {
          $sum: {
            $cond: [{ $ne: ['$_id', 'idle'] }, '$count', 0],
          },
        },
      },
    },
  ]);
};

// Export the model
export const UserState = mongoose.model<IUserState>('UserState', userStateSchema);