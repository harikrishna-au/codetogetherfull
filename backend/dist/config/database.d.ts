import mongoose from 'mongoose';
export declare const connectDatabase: () => Promise<void>;
export declare const disconnectDatabase: () => Promise<void>;
export declare const getDatabaseStatus: () => {
    isConnected: boolean;
    readyState: mongoose.ConnectionStates;
    host: string;
    port: number;
    name: string;
};
export declare const initializeIndexes: () => Promise<void>;
export declare const checkDatabaseHealth: () => Promise<boolean>;
//# sourceMappingURL=database.d.ts.map