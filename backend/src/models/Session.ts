import mongoose, { Schema, Document } from 'mongoose';
import { Session as ISession } from '../types/auth';

export interface SessionDocument extends Omit<ISession, '_id'>, Document {
  _id: string;
  updateHeartbeat(): Promise<SessionDocument>;
  expire(): Promise<SessionDocument>;
}

const SessionSchema = new Schema<SessionDocument>({
  userId: {
    type: String,
    required: true
  },
  roomId: {
    type: String,
    default: null
  },
  partnerId: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sessionToken: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  lastHeartbeat: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'sessions'
});

// Indexes for better query performance
SessionSchema.index({ userId: 1, isActive: 1 });
SessionSchema.index({ sessionToken: 1 });
SessionSchema.index({ expiresAt: 1 });
SessionSchema.index({ lastHeartbeat: 1 });

// Static methods
SessionSchema.statics.findByToken = function(sessionToken: string) {
  return this.findOne({ 
    sessionToken, 
    isActive: true,
    expiresAt: { $gt: new Date() }
  });
};

SessionSchema.statics.findActiveByUserId = function(userId: string) {
  return this.findOne({ 
    userId, 
    isActive: true,
    expiresAt: { $gt: new Date() }
  });
};

SessionSchema.statics.expireUserSessions = function(userId: string) {
  return this.updateMany(
    { userId, isActive: true },
    { isActive: false }
  );
};

SessionSchema.statics.cleanExpiredSessions = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isActive: false }
    ]
  });
};

// Define interface for static methods
interface SessionModel extends mongoose.Model<SessionDocument> {
  findByToken(sessionToken: string): Promise<SessionDocument | null>;
  findActiveByUserId(userId: string): Promise<SessionDocument | null>;
  expireUserSessions(userId: string): Promise<any>;
  cleanExpiredSessions(): Promise<any>;
}

// Instance methods
SessionSchema.methods.updateHeartbeat = function() {
  this.lastHeartbeat = new Date();
  return this.save();
};

SessionSchema.methods.expire = function() {
  this.isActive = false;
  return this.save();
};

export const Session = mongoose.model<SessionDocument, SessionModel>('Session', SessionSchema);
