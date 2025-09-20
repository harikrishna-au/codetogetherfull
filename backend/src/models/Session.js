import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  userData: {
    name: String,
    email: String,
    avatar: String
  },
  state: {
    type: String,
    enum: ['na', 'waiting', 'matched', 'in-session'],
    default: 'na',
    index: true
  },
  roomId: {
    type: String,
    required: false,
    index: true
  },
  queueInfo: {
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    mode: String,
    joinedAt: Date,
    position: Number
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
sessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.lastActivity = new Date();
  next();
});

// Indexes for performance
sessionSchema.index({ sessionId: 1 });
sessionSchema.index({ userId: 1 });
sessionSchema.index({ isActive: 1, lastActivity: -1 });
sessionSchema.index({ state: 1, isActive: 1 });

export default mongoose.model('Session', sessionSchema);
