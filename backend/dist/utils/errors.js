import { logger } from './logger.js';
export class AppError extends Error {
    statusCode;
    code;
    isOperational;
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class ValidationError extends AppError {
    constructor(message, _details) {
        super(message, 400, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}
export class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401, 'AUTHENTICATION_ERROR');
        this.name = 'AuthenticationError';
    }
}
export class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403, 'AUTHORIZATION_ERROR');
        this.name = 'AuthorizationError';
    }
}
export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND_ERROR');
        this.name = 'NotFoundError';
    }
}
export class ConflictError extends AppError {
    constructor(message) {
        super(message, 409, 'CONFLICT_ERROR');
        this.name = 'ConflictError';
    }
}
export class DatabaseError extends AppError {
    constructor(message = 'Database operation failed') {
        super(message, 500, 'DATABASE_ERROR');
        this.name = 'DatabaseError';
    }
}
export class ExternalServiceError extends AppError {
    constructor(message = 'External service error') {
        super(message, 502, 'EXTERNAL_SERVICE_ERROR');
        this.name = 'ExternalServiceError';
    }
}
export const sendErrorResponse = (res, error, requestId) => {
    const isAppError = error instanceof AppError;
    const statusCode = isAppError ? error.statusCode : 500;
    const code = isAppError ? error.code : 'INTERNAL_SERVER_ERROR';
    logger.error('Error occurred', {
        message: error.message,
        stack: error.stack,
        statusCode,
        code,
        requestId,
    });
    res.status(statusCode).json({
        success: false,
        error: error.message,
        code,
        timestamp: new Date().toISOString(),
        ...(requestId && { requestId }),
    });
};
export const globalErrorHandler = (error, req, res, _next) => {
    if (error.name === 'ValidationError') {
        return sendErrorResponse(res, new ValidationError(error.message), req.id);
    }
    if (error.name === 'CastError') {
        return sendErrorResponse(res, new ValidationError('Invalid ID format'), req.id);
    }
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
        return sendErrorResponse(res, new DatabaseError('Database operation failed'), req.id);
    }
    if (error.name === 'JsonWebTokenError') {
        return sendErrorResponse(res, new AuthenticationError('Invalid token'), req.id);
    }
    if (error.name === 'TokenExpiredError') {
        return sendErrorResponse(res, new AuthenticationError('Token expired'), req.id);
    }
    if (error instanceof AppError && error.isOperational) {
        return sendErrorResponse(res, error, req.id);
    }
    logger.error('Unhandled error', {
        message: error.message,
        stack: error.stack,
        requestId: req.id,
    });
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
        ...(req.id && { requestId: req.id }),
    });
};
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
//# sourceMappingURL=errors.js.map