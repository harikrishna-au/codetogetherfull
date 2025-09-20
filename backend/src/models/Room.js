import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  id: Number,
  message: String,
  sender: String,
  sessionId: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true
  },
  userId: String,
  ready: {
    type: Boolean,
    default: false
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
});

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  users: [userSchema],
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  question: {
    questionId: String,
    title: String,
    description: String,
    difficulty: String,
    examples: Array,
    constraints: Array,
    starterCode: Object
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'terminated'],
    default: 'waiting',
    index: true
  },
  code: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'javascript'
  },
  chatHistory: [chatMessageSchema],
  testResults: {
    results: mongoose.Schema.Types.Mixed,
    timestamp: Date,
    submittedBy: String
  },
  endReason: String,
  endedAt: Date,
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
roomSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for performance
roomSchema.index({ roomId: 1 });
roomSchema.index({ status: 1, createdAt: -1 });
roomSchema.index({ 'users.sessionId': 1 });

export default mongoose.model('Room', roomSchema);
