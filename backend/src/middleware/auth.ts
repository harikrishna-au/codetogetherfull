import { Request, Response, NextFunction } from 'express';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { logger } from '@/utils/logger.js';
import { AuthenticationError, sendErrorResponse } from '@/utils/errors.js';
import type { AuthenticatedRequest } from '@/types/index.js';
import { env } from '@/config/env.js';
import { AuthService } from '@/services/AuthService.js';

const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

// Extract token from request
const extractToken = (req: Request): string | null => {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  const cookieToken = req.cookies?.sessionToken;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
};

// Authentication middleware
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    try {
      // Verify token with Clerk
      const tokenPayload = await clerkClient.verifyToken(token);

      // Get user details from our DB (sync if needed)
      // We pass the Clerk User ID (sub)
      // AuthService needs to be updated to handle this
      const { user, dbUser } = await AuthService.validateSession(tokenPayload.sub);

      // Attach user info to request
      req.user = user;
      req.dbUser = dbUser;

      // Also attach Clerk Auth info if useful
      // req.auth = tokenPayload; 

      logger.debug('User authenticated successfully', {
        userId: user.userId,
        email: user.email,
      });

      next();
    } catch (err) {
      // If verifyToken fails
      throw new AuthenticationError('Invalid authentication token');
    }

  } catch (error) {
    logger.warn('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    const message = error instanceof Error ? error.message : 'Authentication failed';
    sendErrorResponse(res, 401, message);
  }
};

// Optional authentication middleware
export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token) {
      try {
        const tokenPayload = await clerkClient.verifyToken(token);
        const { user, dbUser } = await AuthService.validateSession(tokenPayload.sub);
        req.user = user;
        req.dbUser = dbUser;
      } catch (e) {
        // Ignore invalid token for optional auth
      }
    }

    next();
  } catch (error) {
    logger.debug('Optional authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    next();
  }
};

// Admin authentication middleware
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // First authenticate the user
    await authenticateToken(req, res, () => { });

    // Check if user has admin privileges
    const adminEmails = ['admin@codetogether.com']; // Add your admin emails
    // Or check Clerk metadata

    if (!req.user || !adminEmails.includes(req.user.email)) {
      throw new AuthenticationError('Admin access required');
    }

    logger.info('Admin access granted', {
      userId: req.user.userId,
      email: req.user.email,
    });

    next();
  } catch (error) {
    logger.warn('Admin authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.userId,
    });

    const message = error instanceof Error ? error.message : 'Admin access denied';
    sendErrorResponse(res, 403, message);
  }
};


// Rate limiting by user
export const rateLimitByUser = (maxRequests: number, windowMs: number) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userId = req.user?.userId;

    if (!userId) {
      return next();
    }

    const now = Date.now();
    const userLimit = userRequests.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or create new limit
      userRequests.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      logger.warn('Rate limit exceeded for user', {
        userId,
        count: userLimit.count,
        maxRequests,
      });

      res.status(429).json({
        success: false,
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000),
      });
      return;
    }

    userLimit.count++;
    next();
  };
};

// Socket authentication middleware
export const authenticateSocket = async (token: string): Promise<any> => {
  try {
    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    const tokenPayload = await clerkClient.verifyToken(token);
    const { user, dbUser } = await AuthService.validateSession(tokenPayload.sub);

    logger.debug('Socket authenticated successfully', {
      userId: user.userId,
      email: user.email,
    });

    return { user, dbUser };
  } catch (error) {
    logger.warn('Socket authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
};