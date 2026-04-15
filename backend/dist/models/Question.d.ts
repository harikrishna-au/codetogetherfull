import mongoose from 'mongoose';
import { Question as IQuestion } from '../types/index.js';
export declare const Question: mongoose.Model<IQuestion, {}, {}, {}, mongoose.Document<unknown, {}, IQuestion, {}, {}> & IQuestion & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Question.d.ts.map