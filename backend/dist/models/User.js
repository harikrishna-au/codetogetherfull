import mongoose, { Schema } from 'mongoose';
const sessionRecordSchema = new Schema({
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
const userSchema = new Schema({
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
userSchema.index({ userId: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ lastLogin: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ completedQuestions: 1 });
userSchema.methods.addCompletedQuestion = function (questionId) {
    if (!this.completedQuestions.includes(questionId)) {
        this.completedQuestions.push(questionId);
    }
    return this.save();
};
userSchema.methods.addSessionRecord = function (sessionRecord) {
    this.sessionHistory.push(sessionRecord);
    return this.save();
};
userSchema.methods.updateLastLogin = function () {
    this.lastLogin = new Date();
    return this.save();
};
userSchema.statics.findByUserId = function (userId) {
    return this.findOne({ userId });
};
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() });
};
userSchema.statics.getActiveUsers = function (since) {
    return this.find({ lastLogin: { $gte: since } });
};
userSchema.statics.getUserStats = function (userId) {
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
export const User = mongoose.model('User', userSchema);
//# sourceMappingURL=User.js.map