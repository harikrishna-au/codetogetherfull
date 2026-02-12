import mongoose from 'mongoose';
import { UserState as IUserState } from '@/types/index.js';
export declare const UserState: mongoose.Model<IUserState, {}, {}, {}, mongoose.Document<unknown, {}, IUserState, {}, {}> & IUserState & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=UserState.d.ts.map