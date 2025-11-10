import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Server
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // MongoDB
  MONGODB_URI: z.string().default('mongodb://localhost:27017/codetogether'),
  MONGODB_TEST_URI: z.string().default('mongodb://localhost:27017/codetogether_test'),
  
  // Firebase
  FIREBASE_PROJECT_ID: z.string(),
  FIREBASE_PRIVATE_KEY_ID: z.string(),
  FIREBASE_PRIVATE_KEY: z.string(),
  FIREBASE_CLIENT_EMAIL: z.string(),
  FIREBASE_CLIENT_ID: z.string(),
  FIREBASE_AUTH_URI: z.string().default('https://accounts.google.com/o/oauth2/auth'),
  FIREBASE_TOKEN_URI: z.string().default('https://oauth2.googleapis.com/token'),
  FIREBASE_AUTH_PROVIDER_X509_CERT_URL: z.string().default('https://www.googleapis.com/oauth2/v1/certs'),
  FIREBASE_CLIENT_X509_CERT_URL: z.string(),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  
  // Timeouts
  SESSION_TIMEOUT_MINUTES: z.string().default('60').transform(Number),
  ROOM_TIMEOUT_MINUTES: z.string().default('90').transform(Number),
  QUEUE_TIMEOUT_MINUTES: z.string().default('10').transform(Number),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('logs/app.log'),
});

// Validate and export environment variables
export const env = envSchema.parse(process.env);

// Firebase service account configuration
export const firebaseConfig = {
  type: 'service_account',
  project_id: env.FIREBASE_PROJECT_ID,
  private_key_id: env.FIREBASE_PRIVATE_KEY_ID,
  private_key: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: env.FIREBASE_CLIENT_EMAIL,
  client_id: env.FIREBASE_CLIENT_ID,
  auth_uri: env.FIREBASE_AUTH_URI,
  token_uri: env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: env.FIREBASE_CLIENT_X509_CERT_URL,
};

// Database configuration
export const dbConfig = {
  uri: env.NODE_ENV === 'test' ? env.MONGODB_TEST_URI : env.MONGODB_URI,
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
};

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