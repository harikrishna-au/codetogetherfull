import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: false,
    sparse: true
  },
  name: {
    type: String,
    required: false
  },
  avatar: {
    type: String,
    required: false
  },
  preferences: {
    language: {
      type: String,
      default: 'javascript'
    },
    theme: {
      type: String,
      default: 'dark'
    }
  },
  stats: {
    totalSessions: {
      type: Number,
      default: 0
    },
    completedProblems: [{
      questionId: String,
      difficulty: String,
      completedAt: Date,
      language: String
    }],
    averageSessionTime: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
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
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for performance
userSchema.index({ userId: 1 });
userSchema.index({ isActive: 1, lastActivity: -1 });

export default mongoose.model('User', userSchema);
