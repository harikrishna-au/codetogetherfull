import mongoose, { Schema } from 'mongoose';
const exampleSchema = new Schema({
    input: {
        type: String,
        required: true,
    },
    output: {
        type: String,
        required: true,
    },
    explanation: {
        type: String,
    },
}, { _id: false });
const testCaseSchema = new Schema({
    input: {
        type: Schema.Types.Mixed,
        required: true,
    },
    output: {
        type: String,
        required: true,
    },
    explanation: {
        type: String,
    },
}, { _id: false });
const starterCodeSchema = new Schema({
    java: {
        type: String,
        default: '',
    },
    python: {
        type: String,
        default: '',
    },
    cpp: {
        type: String,
        default: '',
    },
    javascript: {
        type: String,
        default: '',
    },
}, { _id: false });
const questionSchema = new Schema({
    questionId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['Easy', 'Medium', 'Hard'],
        index: true,
    },
    examples: [exampleSchema],
    constraints: [{
            type: String,
        }],
    tags: [{
            type: String,
            index: true,
        }],
    hints: [{
            type: String,
        }],
    starterCode: {
        type: starterCodeSchema,
        default: () => ({}),
    },
    compileTestCases: [testCaseSchema],
    majorTestCases: [testCaseSchema],
    usageCount: {
        type: Number,
        default: 0,
        index: true,
    },
    averageCompletionTime: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
    collection: 'questions',
});
questionSchema.index({ questionId: 1 }, { unique: true });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ usageCount: -1 });
questionSchema.index({ createdAt: -1 });
questionSchema.index({ difficulty: 1, usageCount: 1 });
questionSchema.methods.incrementUsage = function () {
    this.usageCount += 1;
    return this.save();
};
questionSchema.methods.updateAverageCompletionTime = function (newTime) {
    if (this.usageCount === 0) {
        this.averageCompletionTime = newTime;
    }
    else {
        this.averageCompletionTime = (this.averageCompletionTime * (this.usageCount - 1) + newTime) / this.usageCount;
    }
    return this.save();
};
questionSchema.statics.findByDifficulty = function (difficulty) {
    return this.find({ difficulty });
};
questionSchema.statics.findByTags = function (tags) {
    return this.find({ tags: { $in: tags } });
};
questionSchema.statics.getRandomQuestion = function (difficulty, excludeIds = []) {
    const matchStage = { difficulty };
    if (excludeIds.length > 0) {
        matchStage.questionId = { $nin: excludeIds };
    }
    return this.aggregate([
        { $match: matchStage },
        { $sample: { size: 1 } },
    ]);
};
questionSchema.statics.getQuestionStats = function () {
    return this.aggregate([
        {
            $group: {
                _id: '$difficulty',
                count: { $sum: 1 },
                totalUsage: { $sum: '$usageCount' },
                avgCompletionTime: { $avg: '$averageCompletionTime' },
            },
        },
        {
            $group: {
                _id: null,
                totalQuestions: { $sum: '$count' },
                byDifficulty: {
                    $push: {
                        difficulty: '$_id',
                        count: '$count',
                        totalUsage: '$totalUsage',
                        avgCompletionTime: '$avgCompletionTime',
                    },
                },
            },
        },
    ]);
};
questionSchema.statics.getMostUsedQuestions = function (limit = 10) {
    return this.find({})
        .sort({ usageCount: -1 })
        .limit(limit)
        .select('questionId title usageCount difficulty');
};
questionSchema.statics.getNextQuestionId = async function () {
    const lastQuestion = await this.findOne({}, {}, { sort: { questionId: -1 } });
    if (!lastQuestion) {
        return 'q1';
    }
    const lastNumber = parseInt(lastQuestion.questionId.replace('q', ''));
    return `q${lastNumber + 1}`;
};
export const Question = mongoose.model('Question', questionSchema);
//# sourceMappingURL=Question.js.map