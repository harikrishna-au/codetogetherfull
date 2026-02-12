import mongoose, { Schema } from 'mongoose';
const codeSubmissionSchema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    testResults: {
        type: Schema.Types.Mixed,
    },
}, { _id: false });
const sessionSchema = new Schema({
    roomId: {
        type: String,
        required: true,
        index: true,
    },
    participants: [{
            type: String,
            required: true,
        }],
    questionId: {
        type: String,
        required: true,
        index: true,
    },
    startedAt: {
        type: Date,
        required: true,
        index: true,
    },
    endedAt: {
        type: Date,
        index: true,
    },
    duration: {
        type: Number,
    },
    completed: {
        type: Boolean,
        default: false,
    },
    codeSubmissions: [codeSubmissionSchema],
    chatMessageCount: {
        type: Number,
        default: 0,
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['Easy', 'Medium', 'Hard'],
        index: true,
    },
    mode: {
        type: String,
        required: true,
        enum: ['friendly', 'challenge'],
        index: true,
    },
}, {
    timestamps: true,
    collection: 'sessions',
});
sessionSchema.index({ roomId: 1 });
sessionSchema.index({ participants: 1 });
sessionSchema.index({ startedAt: -1 });
sessionSchema.index({ questionId: 1 });
sessionSchema.index({ difficulty: 1, mode: 1 });
sessionSchema.index({ completed: 1 });
sessionSchema.methods.addCodeSubmission = function (userId, code, testResults) {
    this.codeSubmissions.push({
        userId,
        code,
        timestamp: new Date(),
        testResults,
    });
    return this.save();
};
sessionSchema.methods.endSession = function (completed = false) {
    this.endedAt = new Date();
    this.duration = this.endedAt.getTime() - this.startedAt.getTime();
    this.completed = completed;
    return this.save();
};
sessionSchema.methods.incrementChatCount = function () {
    this.chatMessageCount += 1;
    return this.save();
};
sessionSchema.statics.findByParticipant = function (userId) {
    return this.find({ participants: userId }).sort({ startedAt: -1 });
};
sessionSchema.statics.findByQuestion = function (questionId) {
    return this.find({ questionId }).sort({ startedAt: -1 });
};
sessionSchema.statics.getSessionStats = function (startDate, endDate) {
    const matchStage = {};
    if (startDate || endDate) {
        matchStage.startedAt = {};
        if (startDate)
            matchStage.startedAt.$gte = startDate;
        if (endDate)
            matchStage.startedAt.$lte = endDate;
    }
    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalSessions: { $sum: 1 },
                completedSessions: { $sum: { $cond: ['$completed', 1, 0] } },
                avgDuration: { $avg: '$duration' },
                avgChatMessages: { $avg: '$chatMessageCount' },
                byDifficulty: {
                    $push: {
                        difficulty: '$difficulty',
                        count: 1,
                        avgDuration: '$duration',
                    },
                },
                byMode: {
                    $push: {
                        mode: '$mode',
                        count: 1,
                        avgDuration: '$duration',
                    },
                },
            },
        },
    ]);
};
sessionSchema.statics.getDailyStats = function (days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.aggregate([
        { $match: { startedAt: { $gte: startDate } } },
        {
            $group: {
                _id: {
                    year: { $year: '$startedAt' },
                    month: { $month: '$startedAt' },
                    day: { $dayOfMonth: '$startedAt' },
                },
                sessions: { $sum: 1 },
                completed: { $sum: { $cond: ['$completed', 1, 0] } },
                avgDuration: { $avg: '$duration' },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);
};
sessionSchema.statics.getPopularQuestions = function (limit = 10) {
    return this.aggregate([
        {
            $group: {
                _id: '$questionId',
                sessionCount: { $sum: 1 },
                completionRate: { $avg: { $cond: ['$completed', 1, 0] } },
                avgDuration: { $avg: '$duration' },
            },
        },
        { $sort: { sessionCount: -1 } },
        { $limit: limit },
    ]);
};
sessionSchema.statics.getUserSessionHistory = function (userId, limit = 20) {
    return this.find({ participants: userId })
        .sort({ startedAt: -1 })
        .limit(limit)
        .populate('questionId', 'title difficulty');
};
export const Session = mongoose.model('Session', sessionSchema);
//# sourceMappingURL=Session.js.map