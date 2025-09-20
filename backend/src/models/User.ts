import mongoose, { Schema, Document } from 'mongoose';
import { User as IUser } from '../types/auth';

export interface UserDocument extends Omit<IUser, '_id'>, Document {
  _id: string;
  updateActivity(): Promise<UserDocument>;
  setInactive(): Promise<UserDocument>;
}

const UserSchema = new Schema<UserDocument>({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  preferredLanguages: [{
    type: String,
    trim: true
  }],
  completedQuestions: [{
    type: String,
    trim: true
  }],
  totalSessions: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ lastActive: 1 });

// Pre-save middleware to update lastActive when user becomes active
UserSchema.pre('save', function(next) {
  if (this.isModified('isActive') && this.isActive) {
    this.lastActive = new Date();
  }
  next();
});

// Instance methods
UserSchema.methods.updateActivity = function() {
  this.lastActive = new Date();
  this.isActive = true;
  return this.save();
};

UserSchema.methods.setInactive = function() {
  this.isActive = false;
  return this.save();
};

// Static methods
UserSchema.statics.findByGoogleId = function(googleId: string) {
  return this.findOne({ googleId });
};

UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.getActiveUsers = function() {
  return this.find({ isActive: true }).select('_id name username avatar isActive lastActive');
};

// Define interface for static methods
interface UserModel extends mongoose.Model<UserDocument> {
  findByGoogleId(googleId: string): Promise<UserDocument | null>;
  findByEmail(email: string): Promise<UserDocument | null>;
  getActiveUsers(): Promise<UserDocument[]>;
}

export const User = mongoose.model<UserDocument, UserModel>('User', UserSchema);
