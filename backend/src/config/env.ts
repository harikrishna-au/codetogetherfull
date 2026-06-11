import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config({ debug: true });

// Environment validation schema
const envSchema = z.object({
  // Server
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // MongoDB (Removed)
  // MONGODB_URI: z.string().default('mongodb://localhost:27017/codetogether'),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_KEY: z.string().min(1),

  // Clerk
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),

  // JWT (Legacy/Internal)
  JWT_SECRET: z.string().min(32).optional(),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:8080'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('300').transform(Number),

  // Timeouts
  SESSION_TIMEOUT_MINUTES: z.string().default('60').transform(Number),
  ROOM_TIMEOUT_MINUTES: z.string().default('90').transform(Number),
  QUEUE_TIMEOUT_MINUTES: z.string().default('10').transform(Number),
  // Grace period before a disconnected player forfeits an active match (A4)
  FORFEIT_GRACE_SECONDS: z.string().default('60').transform(Number),

  // Code execution isolation (A2): 'docker' runs submissions in locked-down
  // containers (the security boundary); 'local' spawns directly on the host
  // and must ONLY be used for development machines without Docker.
  EXECUTION_MODE: z.enum(['docker', 'local']).default('docker'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('logs/app.log'),
});

// Validate and export environment variables
export const env = envSchema.parse(process.env);

// Firebase service account configuration
// Firebase/Clerk configuration replaced by directenv usage or Clerk SDK defaults


// Database configuration
// Database configuration (Supabase is used directly)
export const dbConfig = {};

// CORS configuration
export const corsConfig = {
  origin: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
};

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};

// Session timeouts (in milliseconds)
export const timeouts = {
  session: env.SESSION_TIMEOUT_MINUTES * 60 * 1000,
  room: env.ROOM_TIMEOUT_MINUTES * 60 * 1000,
  queue: env.QUEUE_TIMEOUT_MINUTES * 60 * 1000,
};