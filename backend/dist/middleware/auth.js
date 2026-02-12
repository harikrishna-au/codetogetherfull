import { createClerkClient } from '@clerk/clerk-sdk-node';
import { logger } from '@/utils/logger.js';
import { AuthenticationError, sendErrorResponse } from '@/utils/errors.js';
import { env } from '@/config/env.js';
import { AuthService } from '@/services/AuthService.js';
const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    const cookieToken = req.cookies?.sessionToken;
    if (cookieToken) {
        return cookieToken;
    }
    return null;
};
export const authenticateToken = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            throw new AuthenticationError('No authentication token provided');
        }
        try {
            const tokenPayload = await clerkClient.verifyToken(token);
            const { user, dbUser } = await AuthService.validateSession(tokenPayload.sub);
            req.user = user;
            req.dbUser = dbUser;
            logger.debug('User authenticated successfully', {
                userId: user.userId,
                email: user.email,
            });
            next();
        }
        catch (err) {
            throw new AuthenticationError('Invalid authentication token');
        }
    }
    catch (error) {
        logger.warn('Authentication failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        sendErrorResponse(res, error instanceof Error ? error : new AuthenticationError('Authentication failed'));
    }
};
export const optionalAuth = async (req, _res, next) => {
    try {
        const token = extractToken(req);
        if (token) {
            try {
                const tokenPayload = await clerkClient.verifyToken(token);
                const { user, dbUser } = await AuthService.validateSession(tokenPayload.sub);
                req.user = user;
                req.dbUser = dbUser;
            }
            catch (e) {
            }
        }
        next();
    }
    catch (error) {
        logger.debug('Optional authentication failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next();
    }
};
export const requireAdmin = async (req, res, next) => {
    try {
        await authenticateToken(req, res, () => { });
        const adminEmails = ['admin@codetogether.com'];
        if (!req.user || !adminEmails.includes(req.user.email)) {
            throw new AuthenticationError('Admin access required');
        }
        logger.info('Admin access granted', {
            userId: req.user.userId,
            email: req.user.email,
        });
        next();
    }
    catch (error) {
        logger.warn('Admin authentication failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?.userId,
        });
        sendErrorResponse(res, error instanceof Error ? error : new AuthenticationError('Admin access denied'));
    }
};
export const rateLimitByUser = (maxRequests, windowMs) => {
    const userRequests = new Map();
    return (req, res, next) => {
        const userId = req.user?.userId;
        if (!userId) {
            return next();
        }
        const now = Date.now();
        const userLimit = userRequests.get(userId);
        if (!userLimit || now > userLimit.resetTime) {
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
export const authenticateSocket = async (token) => {
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
    }
    catch (error) {
        logger.warn('Socket authentication failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
};
//# sourceMappingURL=auth.js.map