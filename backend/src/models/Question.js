import mongoose from 'mongoose';

const exampleSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true
  },
  output: {
    type: String,
    required: true
  },
  explanation: {
    type: String,
    required: false
  }
});

const testCaseSchema = new mongoose.Schema({
  input: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  output: {
    type: String,
    required: true
  },
  explanation: {
    type: String,
    required: false
  },
  isHidden: {
    type: Boolean,
    default: false
  }
});

const starterCodeSchema = new mongoose.Schema({
  javascript: String,
  python: String,
  java: String,
  cpp: String,
  go: String
});

const questionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard'],
    index: true
  },
  description: {
    type: String,
    required: true
  },
  examples: [exampleSchema],
  constraints: [String],
  tags: [String],
  hints: [String],
  starterCode: starterCodeSchema,
  testCases: [testCaseSchema],
  majorTestCases: [testCaseSchema],
  compileTestCases: [testCaseSchema],
  stats: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    successfulAttempts: {
      type: Number,
      default: 0
    },
    averageTime: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: false
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
questionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for performance
questionSchema.index({ questionId: 1 });
questionSchema.index({ difficulty: 1, isActive: 1 });
questionSchema.index({ tags: 1 });

export default mongoose.model('Question', questionSchema);
