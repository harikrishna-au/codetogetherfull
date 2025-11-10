import mongoose, { Schema } from 'mongoose';
import { User as IUser, SessionRecord } from '@/types/index.js';

// Session record schema
const sessionRecordSchema = new Schema<SessionRecord>({
  roomId: {
    type: String,
    required: true,
  },
  questionId: {
    type: String,
    required: true,
  },
  completedAt: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  partner: {
    type: String,
    required: true,
  },
}, { _id: false });

// User preferences schema
const userPreferencesSchema = new Schema({
  preferredDifficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy',
  },
  preferredLanguage: {
    type: String,
    enum: ['javascript', 'python', 'java', 'cpp'],
    default: 'javascript',
  },
}, { _id: false });

// User schema
const userSchema = new Schema<IUser>({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  },
  displayName: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
    index: true,
  },
  completedQuestions: [{
    type: String,
    index: true,
  }],
  sessionHistory: [sessionRecordSchema],
  preferences: {
    type: userPreferencesSchema,
    default: () => ({}),
  },
}, {
  timestamps: true,
  collection: 'users',
});

// Indexes
userSchema.index({ userId: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ lastLogin: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ completedQuestions: 1 });

// Instance methods
userSchema.methods.addCompletedQuestion = function(questionId: string) {
  if (!this.completedQuestions.includes(questionId)) {
    this.completedQuestions.push(questionId);
  }
  return this.save();
};

userSchema.methods.addSessionRecord = function(sessionRecord: SessionRecord) {
  this.sessionHistory.push(sessionRecord);
  return this.save();
};

userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Static methods
userSchema.statics.findByUserId = function(userId: string) {
  return this.findOne({ userId });
};

userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.getActiveUsers = function(since: Date) {
  return this.find({ lastLogin: { $gte: since } });
};

userSchema.statics.getUserStats = function(userId: string) {
  return this.aggregate([
    { $match: { userId } },
    {
      $project: {
        totalSessions: { $size: '$sessionHistory' },
        totalQuestionsCompleted: { $size: '$completedQuestions' },
        averageSessionDuration: { $avg: '$sessionHistory.duration' },
        lastSession: { $max: '$sessionHistory.completedAt' },
        preferences: 1,
        createdAt: 1,
        lastLogin: 1,
      },
    },
  ]);
};

// Export the model
export const User = mongoose.model<IUser>('User', userSchema);