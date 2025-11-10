import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/AuthService.js';
import { logger } from '@/utils/logger.js';
import { AuthenticationError, sendErrorResponse } from '@/utils/errors.js';
import type { AuthenticatedRequest } from '@/types/index.js';

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

    // Validate session
    const { user, dbUser } = await AuthService.validateSession(token);
    
    // Attach user info to request
    req.user = user;
    req.dbUser = dbUser;

    logger.debug('User authenticated successfully', {
      userId: user.userId,
      email: user.email,
    });

    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    sendErrorResponse(res, error instanceof Error ? error : new AuthenticationError('Authentication failed'));
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const { user, dbUser } = await AuthService.validateSession(token);
      req.user = user;
      req.dbUser = dbUser;
    }

    next();
  } catch (error) {
    // Log the error but don't fail the request
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
    await authenticateToken(req, res, () => {});
    
    // Check if user has admin privileges
    // For now, we'll use a simple email-based check
    // In production, you might want to use Firebase custom claims
    const adminEmails = ['admin@codetogether.com']; // Add your admin emails
    
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

    sendErrorResponse(res, error instanceof Error ? error : new AuthenticationError('Admin access denied'));
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

      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000),
      });
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

    const { user, dbUser } = await AuthService.validateSession(token);
    
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