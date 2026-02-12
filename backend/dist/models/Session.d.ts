import mongoose from 'mongoose';
export declare const Session: mongoose.Model<{
    roomId: string;
    questionId: string;
    mode: "friendly" | "challenge";
    difficulty: "Easy" | "Medium" | "Hard";
    participants: string[];
    startedAt: NativeDate;
    completed: boolean;
    codeSubmissions: mongoose.Types.DocumentArray<{
        code: string;
        timestamp: NativeDate;
        userId: string;
        testResults?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        code: string;
        timestamp: NativeDate;
        userId: string;
        testResults?: any;
    }> & {
        code: string;
        timestamp: NativeDate;
        userId: string;
        testResults?: any;
    }>;
    chatMessageCount: number;
    duration?: number | null;
    endedAt?: NativeDate | null;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    roomId: string;
    questionId: string;
    mode: "friendly" | "challenge";
    difficulty: "Easy" | "Medium" | "Hard";
    participants: string[];
    startedAt: NativeDate;
    completed: boolean;
    codeSubmissions: mongoose.Types.DocumentArray<{
        code: string;
        timestamp: NativeDate;
        userId: string;
        testResults?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        code: string;
        timestamp: NativeDate;
        userId: string;
        testResults?: any;
    }> & {
        code: string;
        timestamp: NativeDate;
        userId: string;
        testResults?: any;
    }>;
    chatMessageCount: number;
    duration?: number | null;
    endedAt?: NativeDate | null;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
    collection: string;
}> & {
    roomId: string;
    questionId: string;
    mode: "friendly" | "challenge";
    difficulty: "Easy" | "Medium" | "Hard";
    participants: string[];
    startedAt: NativeDate;
    completed: boolean;
    codeSubmissions: mongoose.Types.DocumentArray<{
        code: string;
        timestamp: NativeDate;
        userId: string;
        testResults?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        code: string;
        timestamp: NativeDate;
        userId: string;
        testResults?: any;
    }> & {
        code: string;
        timestamp: NativeDate;
        userId: string;
        testResults?: any;
    }>;
    chatMessageCount: number;
    duration?: number | null;
    endedAt?: NativeDate | null;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
    collection: string;
}, {
    roomId: string;
    questionId: string;
    mode: "friendly" | "challenge";
    difficulty: "Easy" | "Medium" | "Hard";
    participants: string[];
    startedAt: NativeDate;
    completed: boolean;
    codeSubmissions: mongoose.Types.DocumentArray<{
        code: string;
        timestamp: NativeDate;
        userId: string;
        testResults?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        code: string;
        timestamp: NativeDate;
        userId: string;
        testResults?: any;
    }> & {
        code: string;
        timestamp: NativeDate;
        userId: string;
        testResults?: any;
    }>;
    chatMessageCount: number;
    duration?: number | null;
    endedAt?: NativeDate | null;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    roomId: string;
    questionId: string;
    mode: "friendly" | "challenge";
    difficulty: "Easy" | "Medium" | "Hard";
    participants: string[];
    startedAt: NativeDate;
    completed: boolean;
    codeSubmissions: mongoose.Types.DocumentArray<{
        code: string;
        timestamp: NativeDate;
        userId: string;
        testResults?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        code: string;
        timestamp: NativeDate;
        userId: string;
        testResults?: any;
    }> & {
        code: string;
        timestamp: NativeDate;
        userId: string;
        testResults?: any;
    }>;
    chatMessageCount: number;
    duration?: number | null;
    endedAt?: NativeDate | null;
} & mongoose.DefaultTimestampProps>, {}, mongoose.ResolveSchemaOptions<{
    timestamps: true;
    collection: string;
}>> & mongoose.FlatRecord<{
    roomId: string;
    questionId: string;
    mode: "friendly" | "challenge";
    difficulty: "Easy" | "Medium" | "Hard";
    participants: string[];
    startedAt: NativeDate;
    completed: boolean;
    codeSubmissions: mongoose.Types.DocumentArray<{
        code: string;
        timestamp: NativeDate;
        userId: string;
        testResults?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        code: string;
        timestamp: NativeDate;
        userId: string;
        testResults?: any;
    }> & {
        code: string;
        timestamp: NativeDate;
        userId: string;
        testResults?: any;
    }>;
    chatMessageCount: number;
    duration?: number | null;
    endedAt?: NativeDate | null;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=Session.d.ts.map