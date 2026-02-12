import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();
const envSchema = z.object({
    PORT: z.string().default('4000').transform(Number),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    MONGODB_URI: z.string().default('mongodb://localhost:27017/codetogether'),
    MONGODB_TEST_URI: z.string().default('mongodb://localhost:27017/codetogether_test'),
    CLERK_SECRET_KEY: z.string(),
    CLERK_PUBLISHABLE_KEY: z.string().optional(),
    JWT_SECRET: z.string().min(32).optional(),
    JWT_EXPIRES_IN: z.string().default('24h'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
    RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
    SESSION_TIMEOUT_MINUTES: z.string().default('60').transform(Number),
    ROOM_TIMEOUT_MINUTES: z.string().default('90').transform(Number),
    QUEUE_TIMEOUT_MINUTES: z.string().default('10').transform(Number),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    LOG_FILE: z.string().default('logs/app.log'),
});
export const env = envSchema.parse(process.env);
export const dbConfig = {
    uri: env.NODE_ENV === 'test' ? env.MONGODB_TEST_URI : env.MONGODB_URI,
    options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    },
};
export const corsConfig = {
    origin: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
};
export const rateLimitConfig = {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
};
export const timeouts = {
    session: env.SESSION_TIMEOUT_MINUTES * 60 * 1000,
    room: env.ROOM_TIMEOUT_MINUTES * 60 * 1000,
    queue: env.QUEUE_TIMEOUT_MINUTES * 60 * 1000,
};
//# sourceMappingURL=env.js.map