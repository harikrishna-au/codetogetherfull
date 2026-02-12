export declare const env: {
    PORT: number;
    NODE_ENV: "development" | "production" | "test";
    MONGODB_URI: string;
    MONGODB_TEST_URI: string;
    CLERK_SECRET_KEY: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_EXPIRES_IN: string;
    CORS_ORIGIN: string;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX_REQUESTS: number;
    SESSION_TIMEOUT_MINUTES: number;
    ROOM_TIMEOUT_MINUTES: number;
    QUEUE_TIMEOUT_MINUTES: number;
    LOG_LEVEL: "error" | "warn" | "info" | "debug";
    LOG_FILE: string;
    CLERK_PUBLISHABLE_KEY?: string | undefined;
    JWT_SECRET?: string | undefined;
};
export declare const dbConfig: {
    uri: string;
    options: {
        maxPoolSize: number;
        serverSelectionTimeoutMS: number;
        socketTimeoutMS: number;
    };
};
export declare const corsConfig: {
    origin: string[];
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
};
export declare const rateLimitConfig: {
    windowMs: number;
    max: number;
    message: string;
    standardHeaders: boolean;
    legacyHeaders: boolean;
};
export declare const timeouts: {
    session: number;
    room: number;
    queue: number;
};
//# sourceMappingURL=env.d.ts.map